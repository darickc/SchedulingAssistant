import { GoogleCalendarService } from './googleCalendar';
import { TimeSlot, DateRange, SchedulingPreferences, Leader, AppointmentType } from '../types';

export class SchedulingService {
  /**
   * Default business hours (can be made configurable later)
   */
  private static defaultBusinessHours = {
    start: '09:00',
    end: '21:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6] // Sunday through Saturday
  };

  /**
   * Default buffer time between appointments (in minutes)
   */
  private static defaultBufferTime = 15;

  /**
   * Find available time slots for a leader within a date range
   */
  static async findAvailableSlots(
    leaderId: number,
    leader: Leader,
    duration: number,
    dateRange: DateRange,
    preferences?: SchedulingPreferences
  ): Promise<TimeSlot[]> {
    const bufferTime = preferences?.bufferMinutes || this.defaultBufferTime;
    const businessHours = preferences?.preferredTimes || this.defaultBusinessHours;
    
    // Get busy times from Google Calendar
    const busyTimes = await GoogleCalendarService.getFreeBusy(
      leader.calendarId,
      dateRange.start,
      dateRange.end
    );
    
    // Generate all possible slots within business hours
    const allSlots = this.generatePossibleSlots(
      dateRange,
      duration,
      bufferTime,
      businessHours
    );
    
    // Filter out busy times
    const availableSlots = allSlots.filter(slot => {
      return !this.isSlotBusy(slot, busyTimes, bufferTime);
    });
    
    return availableSlots;
  }

  /**
   * Suggest optimal times for an appointment
   */
  static async suggestOptimalTimes(
    contactId: number,
    leaderId: number,
    leader: Leader,
    typeId: number,
    appointmentType: AppointmentType,
    preferences?: SchedulingPreferences
  ): Promise<TimeSlot[]> {
    // Default to next 2 weeks
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    
    const dateRange: DateRange = {
      start: startDate,
      end: endDate
    };
    
    // Get all available slots
    const availableSlots = await this.findAvailableSlots(
      leaderId,
      leader,
      appointmentType.durationMinutes,
      dateRange,
      preferences
    );
    
    // Sort by optimal times (prefer mid-morning and early evening)
    const scoredSlots = availableSlots.map(slot => {
      const score = this.calculateSlotScore(slot, preferences);
      return { ...slot, score };
    });
    
    // Return top 10 suggestions
    return scoredSlots
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ score, ...slot }) => slot);
  }

  /**
   * Generate all possible time slots within business hours
   */
  private static generatePossibleSlots(
    dateRange: DateRange,
    duration: number,
    bufferTime: number,
    businessHours: typeof this.defaultBusinessHours
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const slotDuration = duration + bufferTime;
    
    const currentDate = new Date(dateRange.start);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= dateRange.end) {
      // Check if this day is within business days
      if (businessHours.daysOfWeek.includes(currentDate.getDay())) {
        // Parse business hours
        const [startHour, startMinute] = businessHours.start.split(':').map(Number);
        const [endHour, endMinute] = businessHours.end.split(':').map(Number);
        
        // Generate slots for this day
        const slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);
        
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMinute, 0, 0);
        
        while (slotStart.getTime() + duration * 60 * 1000 <= dayEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
          
          slots.push({
            start: new Date(slotStart),
            end: new Date(slotEnd),
            available: true
          });
          
          // Move to next slot
          slotStart.setMinutes(slotStart.getMinutes() + slotDuration);
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return slots;
  }

  /**
   * Check if a slot conflicts with busy times
   */
  private static isSlotBusy(
    slot: TimeSlot,
    busyTimes: Array<{ start: Date; end: Date }>,
    bufferTime: number
  ): boolean {
    const slotStartWithBuffer = new Date(slot.start.getTime() - bufferTime * 60 * 1000);
    const slotEndWithBuffer = new Date(slot.end.getTime() + bufferTime * 60 * 1000);
    
    return busyTimes.some(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      
      // Check for any overlap
      return (
        (slotStartWithBuffer >= busyStart && slotStartWithBuffer < busyEnd) ||
        (slotEndWithBuffer > busyStart && slotEndWithBuffer <= busyEnd) ||
        (slotStartWithBuffer <= busyStart && slotEndWithBuffer >= busyEnd)
      );
    });
  }

  /**
   * Calculate a score for a time slot based on preferences
   */
  private static calculateSlotScore(
    slot: TimeSlot,
    preferences?: SchedulingPreferences
  ): number {
    let score = 100;
    const slotHour = slot.start.getHours();
    const slotDay = slot.start.getDay();
    
    // Prefer weekday evenings (6-8 PM)
    if (slotHour >= 18 && slotHour < 20 && slotDay >= 1 && slotDay <= 5) {
      score += 30;
    }
    
    // Next preference: Sunday afternoon (2-5 PM)
    if (slotDay === 0 && slotHour >= 14 && slotHour < 17) {
      score += 25;
    }
    
    // Avoid too early or too late
    if (slotHour < 10 || slotHour >= 20) {
      score -= 20;
    }
    
    // Prefer sooner rather than later
    const daysFromNow = Math.floor(
      (slot.start.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    score -= daysFromNow * 2;
    
    // Apply user preferences if provided
    if (preferences?.preferredDays) {
      if (preferences.preferredDays.includes(slotDay)) {
        score += 20;
      }
    }
    
    return Math.max(0, score);
  }

  /**
   * Check if a specific time slot is available
   */
  static async isSlotAvailable(
    leader: Leader,
    start: Date,
    duration: number,
    bufferTime: number = this.defaultBufferTime
  ): Promise<boolean> {
    const end = new Date(start.getTime() + duration * 60 * 1000);
    
    // Get busy times for this specific period (with buffer)
    const checkStart = new Date(start.getTime() - bufferTime * 60 * 1000);
    const checkEnd = new Date(end.getTime() + bufferTime * 60 * 1000);
    
    const busyTimes = await GoogleCalendarService.getFreeBusy(
      leader.calendarId,
      checkStart,
      checkEnd
    );
    
    // If there are any busy times in this period, the slot is not available
    return busyTimes.length === 0;
  }

  /**
   * Get the next available slot for a leader
   */
  static async getNextAvailableSlot(
    leader: Leader,
    duration: number,
    preferences?: SchedulingPreferences
  ): Promise<TimeSlot | null> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Look up to 30 days ahead
    
    const slots = await this.findAvailableSlots(
      leader.id!,
      leader,
      duration,
      { start: startDate, end: endDate },
      preferences
    );
    
    return slots.length > 0 ? slots[0] : null;
  }
}