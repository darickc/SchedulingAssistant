import * as SMS from 'expo-sms';
import { MessageTemplate, MessageVariables, Appointment, Leader, Contact, AppointmentType } from '../types';

export class SMSService {
  /**
   * Check if SMS is available on the device
   */
  static async isAvailable(): Promise<boolean> {
    return await SMS.isAvailableAsync();
  }

  /**
   * Format a message template with actual values
   */
  static formatMessage(
    template: string,
    variables: MessageVariables
  ): string {
    let message = template;
    
    // Replace all variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      message = message.replace(regex, value || '');
    });
    
    return message;
  }

  /**
   * Prepare message variables from appointment data
   */
  static prepareMessageVariables(
    appointment: Appointment,
    contact: Contact,
    leader: Leader,
    appointmentType: AppointmentType
  ): MessageVariables {
    const date = new Date(appointment.scheduledTime);
    
    return {
      name: contact.name,
      leader: leader.name,
      leaderRole: leader.role,
      day: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: `${appointmentType.durationMinutes} minutes`,
      type: appointmentType.name,
      location: 'Church' // You can make this configurable later
    };
  }

  /**
   * Send SMS by opening the native SMS app with pre-filled message
   */
  static async sendSMS(
    phoneNumber: string,
    message: string
  ): Promise<void> {
    const isAvailable = await this.isAvailable();
    
    if (!isAvailable) {
      throw new Error('SMS is not available on this device');
    }
    
    // Clean phone number (remove any non-numeric characters except +)
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    await SMS.sendSMSAsync([cleanedNumber], message);
  }

  /**
   * Send SMS for an appointment
   */
  static async sendAppointmentSMS(
    appointment: Appointment,
    contact: Contact,
    leader: Leader,
    appointmentType: AppointmentType,
    template: MessageTemplate
  ): Promise<void> {
    const variables = this.prepareMessageVariables(
      appointment,
      contact,
      leader,
      appointmentType
    );
    
    const message = this.formatMessage(template.template, variables);
    
    await this.sendSMS(contact.phone, message);
  }

  /**
   * Send bulk SMS for multiple appointments
   * This will open the SMS app multiple times for each contact
   */
  static async sendBulkSMS(
    appointments: Array<{
      appointment: Appointment;
      contact: Contact;
      leader: Leader;
      appointmentType: AppointmentType;
      template: MessageTemplate;
    }>
  ): Promise<Array<{ success: boolean; error?: string; contactName: string }>> {
    const results = [];
    
    for (const item of appointments) {
      try {
        await this.sendAppointmentSMS(
          item.appointment,
          item.contact,
          item.leader,
          item.appointmentType,
          item.template
        );
        
        results.push({
          success: true,
          contactName: item.contact.name
        });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          contactName: item.contact.name
        });
      }
    }
    
    return results;
  }

  /**
   * Generate a preview of the message without sending
   */
  static previewMessage(
    template: MessageTemplate,
    appointment: Appointment,
    contact: Contact,
    leader: Leader,
    appointmentType: AppointmentType
  ): string {
    const variables = this.prepareMessageVariables(
      appointment,
      contact,
      leader,
      appointmentType
    );
    
    return this.formatMessage(template.template, variables);
  }
}