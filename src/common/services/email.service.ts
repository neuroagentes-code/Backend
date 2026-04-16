import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const port = Number.parseInt(process.env.SMTP_PORT) || 465;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465, // true para 465 (SSL), false para 587 (TLS)
      tls: {
        family: 4, // Forzar IPv4, Railway no soporta IPv6
      },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    } as nodemailer.TransportOptions);
  }

  async sendWelcomeEmail(
    email: string,
    companyName: string,
    contactName: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"NeuroAgentes" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Bienvenido a NeuroAgentes - Registro completado exitosamente',
      html: this.getWelcomeEmailTemplate(companyName, contactName),
    };

    try {
      if (process.env.SMTP_USER) {
        await this.transporter.sendMail(mailOptions);
      } else {
        console.log('Email no configurado. Email de bienvenida para:', email);
        console.log('Contenido:', mailOptions.html);
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // No lanzar error para no interrumpir el registro
    }
  }

  async sendPasswordResetOTP(
    email: string,
    otpCode: string,
    firstName: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"NeuroAgentes" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Código de Recuperación de Contraseña - NeuroAgentes',
      html: this.getPasswordResetOTPTemplate(otpCode, firstName),
    };

    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS && !process.env.SMTP_PASS.includes('AQUI_VA_LA_CONTRASEÑA')) {
        console.log('📤 Enviando email con configuración SMTP...');
        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email enviado exitosamente:', result.messageId);
      } else {
        console.log('Email no configurado. Email de OTP para:', email);
        console.log('Código OTP:', otpCode);
        console.log('Contenido:', mailOptions.html);
      }
    } catch (error) {
      console.error('💥 Error sending OTP email:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      });
      console.log('🔐 CÓDIGO OTP DE RESPALDO (úsalo para las pruebas):', otpCode);
    }
  }

  private getWelcomeEmailTemplate(companyName: string, contactName: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a NeuroAgentes</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #007bff;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 5px 5px;
            }
            .button {
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding: 20px;
                font-size: 12px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>¡Bienvenido a NeuroAgentes!</h1>
        </div>
        <div class="content">
            <h2>Hola ${contactName},</h2>
            <p>¡Gracias por registrar <strong>${companyName}</strong> en nuestra plataforma!</p>
            <p>Tu registro ha sido completado exitosamente. Ya puedes acceder a nuestro BackOffice y comenzar a aprovechar todos los servicios que NeuroAgentes tiene para ofrecer.</p>
            
            <h3>¿Qué sigue?</h3>
            <ul>
                <li>Explora el panel de control</li>
                <li>Configura los servicios de tu empresa</li>
                <li>Revisa la documentación disponible</li>
                <li>Contacta a nuestro equipo de soporte si necesitas ayuda</li>
            </ul>

            <p>Si tienes alguna pregunta, no dudes en contactarnos en:</p>
            <ul>
                <li>📞 312 449 3543</li>
                <li>📧 comercial@neuroagentes.co</li>
                <li>🌐 https://neuroagentes.co</li>
            </ul>

            <p><em>Automatiza, evoluciona, conecta.</em></p>
        </div>
        <div class="footer">
            <p>© 2026 NeuroAgentes. Todos los derechos reservados.</p>
            <p>Este es un email automático, por favor no respondas a esta dirección.</p>
        </div>
    </body>
    </html>
    `;
  }

  private getPasswordResetOTPTemplate(otpCode: string, firstName: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Recuperación - NeuroAgentes</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                margin: 0; 
                padding: 20px; 
                background-color: #f4f4f4; 
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 10px; 
                overflow: hidden; 
                box-shadow: 0 0 20px rgba(0,0,0,0.1); 
            }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px; 
                text-align: center; 
            }
            .header h1 { 
                margin: 0; 
                font-size: 28px; 
            }
            .content { 
                padding: 40px 30px; 
                text-align: center; 
            }
            .otp-code {
                background: #f8f9fa;
                border: 2px dashed #6c757d;
                border-radius: 10px;
                font-size: 32px;
                font-weight: bold;
                color: #495057;
                padding: 20px;
                margin: 20px 0;
                letter-spacing: 5px;
                font-family: 'Courier New', monospace;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
            .timer {
                font-size: 18px;
                color: #dc3545;
                font-weight: bold;
                margin: 15px 0;
            }
            .footer { 
                background: #f8f9fa; 
                padding: 20px; 
                text-align: center; 
                color: #6c757d; 
                font-size: 12px; 
            }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
            .security-tips {
                text-align: left;
                background: #e8f4f8;
                border-left: 4px solid #17a2b8;
                padding: 15px;
                margin: 20px 0;
            }
            .security-tips h4 {
                margin-top: 0;
                color: #17a2b8;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔒 Recuperación de Contraseña</h1>
                <p>NeuroAgentes BackOffice</p>
            </div>
            <div class="content">
                <h2>¡Hola ${firstName}!</h2>
                <p>Hemos recibido una solicitud para restablecer tu contraseña en NeuroAgentes.</p>
                
                <p><strong>Tu código de verificación es:</strong></p>
                <div class="otp-code">${otpCode}</div>
                
                <div class="timer">⏰ Este código expira en 5 minutos</div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, ignora este email y tu contraseña permanecerá sin cambios.
                </div>

                <div class="security-tips">
                    <h4>🛡️ Consejos de Seguridad</h4>
                    <ul>
                        <li>Este código es de un solo uso</li>
                        <li>No compartas este código con nadie</li>
                        <li>Nuestro equipo nunca te pedirá este código por teléfono</li>
                        <li>Usa una contraseña segura con mayúsculas, minúsculas, números y símbolos</li>
                    </ul>
                </div>

                <p>Una vez que ingreses este código, podrás crear una nueva contraseña segura.</p>
            </div>
            <div class="footer">
                <p><strong>NeuroAgentes</strong></p>
                <p>📞 312 449 3543 | 📧 comercial@neuroagentes.co | 🌐 https://neuroagentes.co</p>
                <p><em>Automatiza, evoluciona, conecta.</em></p>
                <br>
                <p>© 2026 NeuroAgentes. Todos los derechos reservados.</p>
                <p>Este es un email automático, por favor no respondas a esta dirección.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}
