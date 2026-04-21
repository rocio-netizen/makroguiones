// netlify/functions/generar.js
// Esta función corre en el servidor de Netlify.
// La API key NUNCA llega al browser.
 
export async function handler(event) {
  // Solo aceptamos POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
 
  // Verificamos que la key esté configurada en Netlify
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key no configurada. Agregala en Netlify → Site configuration → Environment variables." })
    };
  }
 
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Body inválido" }) };
  }
 
  const { idea, categoria, tono, duracion, plataforma, referencia } = body;
 
  if (!idea) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta el campo 'idea'" }) };
  }
 
  const prompt = `Sos un especialista en contenido para redes sociales de Makro Argentina (mayorista). Tu tarea es armar un pack de guion completo y profesional para un video de ${duracion} para ${plataforma}.
 
DATOS DEL VIDEO:
- Idea del cliente: ${idea}
- Categoría/Producto: ${categoria || "General / no especificado"}
- Tono: ${tono}
- Duración: ${duracion}
- Plataforma: ${plataforma}
${referencia ? `- Referencia visual del cliente: ${referencia}` : ""}
 
INSTRUCCIONES IMPORTANTES:
- Tono argentino 100%, auténtico, coloquial pero profesional
- Tiene que ser divertido y family friendly
- Duración total: ${duracion} máximo
- Las 4 instancias deben sumar exactamente ese tiempo
- El Hook tiene que ENGANCHAR en los primeros 3 segundos, sorprender o generar curiosidad
- El CTA tiene que ser claro, directo, con el logo/nombre Makro y acción concreta
- Los diálogos/textos deben sonar naturales, como hablaría un argentino real
 
Respondé ÚNICAMENTE con un objeto JSON válido, sin markdown, sin backticks, sin texto antes o después. Formato exacto:
 
{
  "titulo": "Título creativo y memorable del video (máx 8 palabras)",
  "objetivos": [
    "Objetivo de comunicación 1 (acción + resultado esperado)",
    "Objetivo de comunicación 2",
    "Objetivo de comunicación 3"
  ],
  "requerimientos": [
    "Requerimiento de producción o logística 1 (específico y práctico)",
    "Requerimiento 2",
    "Requerimiento 3",
    "Requerimiento 4"
  ],
  "referencia_visual": "Descripción del estilo visual, planos, iluminación y estética que hay que buscar como referencia en Pinterest o TikTok. Sé específico: tipo de cámara, movimiento, paleta de color, ritmo de edición.",
  "instancias": [
    {
      "numero": 1,
      "nombre": "Hook",
      "duracion": "3-4 seg",
      "tipo": "hook",
      "accion_pantalla": "Descripción clara de qué pasa visualmente en la escena",
      "dialogo": "Lo que dice el personaje o el texto que aparece en pantalla.",
      "descripcion_visual": "Tipo de plano, ángulo de cámara, movimiento y detalle visual del shot"
    },
    {
      "numero": 2,
      "nombre": "Desarrollo",
      "duracion": "5-7 seg",
      "tipo": "dev",
      "accion_pantalla": "...",
      "dialogo": "...",
      "descripcion_visual": "..."
    },
    {
      "numero": 3,
      "nombre": "Desarrollo 2",
      "duracion": "5-7 seg",
      "tipo": "dev",
      "accion_pantalla": "...",
      "dialogo": "...",
      "descripcion_visual": "..."
    },
    {
      "numero": 4,
      "nombre": "Call to Action",
      "duracion": "3-5 seg",
      "tipo": "cta",
      "accion_pantalla": "...",
      "dialogo": "...",
      "descripcion_visual": "..."
    }
  ]
}`;
 
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }]
      })
    });
 
    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API error:", errText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Error al llamar a Claude API", detail: errText })
      };
    }
 
    const data = await response.json();
    const rawText = data.content.map(b => b.text || "").join("");
    const clean = rawText.replace(/```json|```/g, "").trim();
    const pack = JSON.parse(clean);
 
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pack)
    };
 
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno en la función", detail: err.message })
    };
  }
}
 
