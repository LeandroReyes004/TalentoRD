# Supabase para TalentoRD

Aplicar la migración en migrations/ al proyecto autorizado. La tabla recruitment_applications utiliza RLS y no concede acceso a anon ni authenticated. Las solicitudes pasan por el servidor. Los CV usan el bucket privado recruitment-cvs.

Crear el administrador en Supabase Authentication, confirmar su correo y añadirlo a ADMIN_EMAILS en Vercel. Ver README.md en la raíz para las variables y el despliegue.

No incluir claves ni datos reales en Git.
