export const MAX_BODY_BYTES = 4 * 1024 * 1024 + 65536;
export async function readApplicationForm(request: Request): Promise<FormData> {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new RangeError('Solicitud demasiado grande.');
  const reader = request.body?.getReader();
  if (!reader) throw new TypeError('Falta el formulario.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RangeError('Solicitud demasiado grande.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset=0;
  for (const chunk of chunks) { body.set(chunk,offset); offset+=chunk.byteLength; }
  return new Response(body,{headers:{'Content-Type':request.headers.get('content-type') || ''}}).formData();
}
