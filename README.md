# TalentoRD

Aplicación de reclutamiento preparada para Vercel con Next.js y Supabase.

- `/postular`: formulario para candidatos con CV en PDF, máximo 4 MB.
- `/admin`: panel privado con candidatos, estados, descarga de CV, métricas y CSV.
- `/admin/login`: acceso con correo y contraseña de Supabase Auth.

## Configuración

1. Crear o seleccionar un proyecto Supabase.
2. Revisar y ejecutar `supabase/migrations/202610200001_recruitment.sql` en el editor SQL del proyecto. Crea una tabla y un bucket privados; no ejecutar de nuevo si ya fue aplicada.
3. Crear el usuario administrador desde Authentication → Users y confirmar su correo.
4. En Vercel, importar este repositorio con el preset **Next.js** y la carpeta raíz **./**.
5. Añadir estas variables en Settings → Environment Variables:

| Variable | Valor |
| --- | --- |
| SUPABASE_URL | URL HTTPS del proyecto |
| SUPABASE_PUBLISHABLE_KEY | Clave publishable del proyecto |
| SUPABASE_SECRET_KEY | Clave secreta de servidor |
| ADMIN_EMAILS | Correos administradores separados por comas |

La clave secreta solo se utiliza en el servidor. No subir archivos .env ni usar prefijos NEXT_PUBLIC para secretos.

El usuario debe existir en Supabase Auth y su correo debe coincidir con ADMIN_EMAILS. No hay registro público de administradores. La sesión dura como máximo una hora; al expirar se requiere iniciar sesión de nuevo.

## Desarrollo y verificación

```sh
npm ci
cp .env.example .env.local
npm run dev
npm run typecheck
npm test
npm run build
```

Sin las variables de Supabase, el formulario muestra el estado de configuración pendiente y no acepta envíos. No se simula almacenamiento.

Se limita el CV a 4 MB para respetar el máximo de 4.5 MB de las funciones de Vercel.
