---
# Preguntas frecuentes: cada «## pregunta» va seguida de su respuesta.
# Prometeo la dice con un audio pregrabado:
#  - si existe agent/faqs-audio/<id>.(wav|mp3|ogg|m4a|webm), se usa esa grabación;
#  - si no, se genera una vez con Kokoro (voz y velocidad actuales) y queda en backend/cache/faqs/.
# <id> es la pregunta en minúsculas, sin tildes ni signos y con guiones: «¿Quién eres?» → quien-eres.
# Respuestas cortas (1–3 frases) y «Prometeo» en minúsculas, para que Kokoro no lo deletree.
---

## ¿Quién eres?
Soy Prometeo, tu agente de planificación por voz. Me cuentas tu idea, te hago las preguntas justas y la convierto en un plan claro y accionable.

## ¿Qué puedes hacer por mí?
Te preparo el plan del proyecto, la lista de tareas, un prompt listo para usar y unas notas de resumen. Todo queda guardado en archivos Markdown que puedes copiar o descargar.

## ¿Cómo funcionas?
Te escucho, te hago las preguntas justas y, cuando el plan está claro, preparo los documentos con calma en segundo plano mientras seguimos hablando. Te aviso en cuanto están listos.

## ¿Por qué te llamas Prometeo?
Por el titán que robó el fuego a los dioses para dárselo a los humanos. Yo intento darte la chispa que convierte una idea difusa en algo que puedes construir.

## ¿Mi voz sale de mi ordenador?
No. Te escucho y te hablo de forma local, con modelos abiertos que se ejecutan en tu equipo. Solo el texto de la conversación va a Claude, o a un modelo local de LM Studio si lo eliges en Ajustes.

## ¿Puedo interrumpirte?
Claro. Si empiezas a hablar mientras te respondo, me callo y te escucho. Usa auriculares para que no me oiga a mí mismo.

## ¿Y si necesito pausas largas para pensar?
Activa el modo por turnos. Así no doy por terminada tu frase hasta que pulses terminar o la barra espaciadora.

## ¿Dónde se guardan mis proyectos?
En la carpeta projects de tu ordenador, cada uno con su conversación y sus entregables. Puedes retomarlos cuando quieras desde Proyectos.

## ¿Puedo cambiar tu voz?
Sí. En Voces puedes escuchar cómo sueno con cada una y quedarte con la que prefieras, y en Ajustes cambiar la velocidad.
