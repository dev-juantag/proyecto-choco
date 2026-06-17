import nodemailer from "nodemailer";

export async function sendRecoveryEmail(
  email: string,
  code: string,
  primerNombre: string,
  isAdminRequest?: boolean
): Promise<boolean> {
  // Check if SMTP is configured. If not, return false to trigger simulation in API route
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[SIMULACIÓN CORREO] Código de recuperación para ${email}: ${code}`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = isAdminRequest 
      ? "Código de Recuperación Administrativo - Sistema de Gestión Poblacional"
      : "Código de Recuperación - Sistema de Gestión Poblacional";

    const mailOptions = {
      from: process.env.SMTP_FROM || `"ESE Atrato" <noreply@atrato.gov.co>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
          <h2 style="color: #0F5132; margin-bottom: 16px;">Recuperación de Contraseña</h2>
          <p>Hola <strong>${primerNombre}</strong>,</p>
          <p>Has solicitado restablecer tu contraseña para ingresar al <strong>Sistema Integral de Gestión Poblacional del Atrato</strong>.</p>
          <p>Utiliza el siguiente código de verificación de 6 dígitos para continuar con el proceso:</p>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0F5132; margin: 24px 0;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Este código es de un solo uso y expirará en 10 minutos. Si no has solicitado este cambio, por favor ignora este correo.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    return false;
  }
}
