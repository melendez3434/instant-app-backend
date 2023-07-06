const sgMail = require('@sendgrid/mail')
const MAILER_ITEMS = {
  // VERIFICATION_CODE: process.env.SENDGRID_TEMPLATE_FOR_VERIFICATION_CODE,
  WELCOME: process.env.SENDGRID_TEMPLATE_FOR_WELCOME!,
  REMINDER: process.env.SENDGRID_TEMPLATE_FOR_REMINDER!,
  THREE_DAY_REMINDER: process.env.SENDGRID_TEMPLATE_FOR_THREE_DAY_REMINDER!,
  RESET_CODE: process.env.SENDGRID_TEMPLATE_FOR_RESET_CODE!,
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendSgMail = ({
  to,
  subject,
  templateId,
  dynamic_template_data,
}: {
  to: string
  subject?: string
  templateId: string
  dynamic_template_data: any
}) => {
  try {
    const msg = {
      to,
      subject,
      from: process.env.SENDGRID_SENDER_EMAIL,
      templateId,
      dynamic_template_data,
    }
    const result = sgMail.send(msg)
    return result
  } catch (error) {
    console.log('🚀 ~ file: sgMail.ts:33 ~ error:', error)
    return error
  }
}
export default sendSgMail
export { sendSgMail, MAILER_ITEMS }
