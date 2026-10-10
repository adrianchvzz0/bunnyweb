/**
 * Enlaces de WhatsApp con el mensaje ya escrito.
 *
 * Un solo lugar para el número y los mensajes: el cliente llega con contexto
 * ("quiero cotizar una tienda") y tú sabes de qué te habla antes de contestar.
 */

export const WHATSAPP_NUMBER = "528187097029";

export const waLink = (message: string) =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const WA = {
    general: waLink("Hola Adrián, vi BunnyWeb y quiero cotizar una página web para mi negocio."),
    servicio: (nombre: string) =>
        waLink(`Hola Adrián, me interesa el servicio de ${nombre}. ¿Me puedes cotizar?`),
    plan: (nombre: string) =>
        waLink(`Hola Adrián, me interesa el plan ${nombre}. ¿Me puedes dar más información?`),
    clinicas: waLink(
        "Hola Adrián, tengo una clínica y quiero ver cómo se vería nuestra página con agenda en línea.",
    ),
    opticas: waLink(
        "Hola Adrián, tengo una óptica y quiero ver cómo se vería nuestro catálogo en línea.",
    ),
};
