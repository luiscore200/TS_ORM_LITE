<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>TS_ORM_LITE - Documentación Oficial</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2rem; max-width: 900px; }
    code, pre { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 4px; }
    pre { padding: 1rem; overflow-x: auto; }
    h1, h2, h3 { border-bottom: 1px solid #ddd; padding-bottom: 0.2rem; }
  </style>
</head>
<body>

<h1>TS_ORM_LITE</h1>

<h2>Introducción</h2>
<p><strong>TS_ORM_LITE</strong> es un micro ORM escrito 100% en TypeScript, diseñado para garantizar integridad de datos y máxima seguridad mediante <strong>tipado estático</strong>.  
Su objetivo principal es que toda la definición de la base de datos, las consultas SQL y la manipulación de datos queden alineadas en un solo flujo, sin duplicidad ni inconsistencias.</p>

<p>El corazón de TS_ORM_LITE es su <strong>diseño fuertemente tipado</strong>. Cada tabla se define en un <code>TableSchema</code> declarativo y cada fila se representa como un <code>Row&lt;T&gt;</code>.  
Esto asegura que el compilador TypeScript valide cada campo, detecte errores antes de ejecutarse y proporcione autocompletado en tiempo real.</p>

<h2>¿Por qué usar Row&lt;T&gt;?</h2>
<p>El <code>Row&lt;T&gt;</code> es una interfaz que describe exactamente cómo luce una fila de la tabla en la base de datos.  
Esto significa que:</p>
<ul>
  <li>Los datos insertados, actualizados y consultados siempre coinciden con la definición real de la tabla.</li>
  <li>Los desarrolladores tienen autocompletado, verificación de tipos y detección de campos inexistentes automáticamente.</li>
  <li>Se eliminan errores comunes de nombre de columnas, tipos incorrectos o claves faltantes.</li>
</ul>

<h3>Generación automática de Row&lt;T&gt;</h3>
<p>La visión del ORM es que <strong>nunca tengas que escribir a mano tus interfaces Row&lt;T&gt;</strong>.  
Para ello se planea un <strong>script de sincronización</strong> que leerá la estructura real de la base de datos, generará los esquemas (<code>TableSchema</code>) y creará automáticamente los tipos <code>Row&lt;T&gt;</code> en archivos centralizados.</p>

<p>De esta forma, si una tabla cambia (se añade una columna, se modifica un tipo), solo necesitas ejecutar el script para tener todo sincronizado y tipado correctamente.</p>

<h2>Flujo actual</h2>
<ul>
  <li><strong>CRUD básico</strong>: createTable, insert, find, update, delete.</li>
  <li><strong>JOINs</strong>: <code>indexWithRelations</code> permite consultas JOIN anidadas y mapea resultados a estructuras anidadas tipadas.</li>
  <li><strong>Inyección de conexión</strong>: el ORM requiere que le pases explícitamente la conexión <code>mysql2/promise</code> mediante el constructor:
<pre><code>const orm = new MiniOrm(poolConnection);</code></pre></li>
</ul>

<p>Esta conexión puede ser un pool, una conexión individual o una transacción (futuro).</p>

<h2>Ejemplo de uso</h2>
<pre><code>// Esquema
export const Users = {
  name: 'users',
  columns: {
    id: { name: 'id', sqlType: { type: 'INT' }, primaryKey: true, autoIncrement: true },
    username: { name: 'username', sqlType: { type: 'VARCHAR', length: 255 }, unique: true },
    email: { name: 'email', sqlType: { type: 'VARCHAR', length: 255 } },
    created_at: { name: 'created_at', sqlType: { type: 'DATETIME' }, default: 'CURRENT_TIMESTAMP' }
  }
} satisfies TableSchema;

export interface UsersRow {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

// Uso
const orm = new MiniOrm(pool);
await orm.createTable(Users);
await orm.insert(Users, [{ username: 'john', email: 'john@example.com' }]);
const { ormResult: users } = await orm.find&lt;UsersRow&gt;(Users);</code></pre>

<h2>Ideas para maduración</h2>
<p>Para convertir TS_ORM_LITE en una herramienta de nivel profesional, se planean los siguientes pasos:</p>
<ol>
  <li><strong>Soporte de transacciones</strong>: encapsular operaciones dentro de <code>BEGIN</code>, <code>COMMIT</code>, <code>ROLLBACK</code>.</li>
  <li><strong>Soporte de UNION y UNION ALL</strong>: consultas combinadas entre múltiples SELECTs tipados.</li>
  <li><strong>Centralización modular</strong>: separar todos los esquemas en módulos reutilizables y exportarlos desde un punto único.</li>
  <li><strong>Script de sincronización</strong>:
    <ol>
      <li>Leer las tablas existentes en la base de datos real.</li>
      <li>Generar archivos <code>TableSchema</code> listos con claves primarias y foráneas alineadas.</li>
      <li>Generar o actualizar automáticamente los <code>Row&lt;T&gt;</code> que se exportarán como tipos compartidos.</li>
      <li>Ordenar relaciones foráneas para crear tablas en el orden correcto sin intervención manual.</li>
    </ol>
  </li>
</ol>

<h2>Desafíos conocidos</h2>
<ul>
  <li>Mantener sincronización bidireccional entre base real y esquemas sin errores humanos.</li>
  <li>Detectar y resolver dependencias foráneas de forma automática.</li>
  <li>Ampliar soporte para migraciones y alteración de tablas en caliente.</li>
</ul>

<h2>Conclusión</h2>
<p><strong>TS_ORM_LITE</strong> es una base sólida para proyectos Node.js + TypeScript que necesitan tipado robusto, bajo acoplamiento y una capa ORM predecible y transparente.
Su enfoque se basa en que <strong>el código TypeScript sea la única fuente de verdad</strong>, y que la generación de esquemas y tipos sea automática y repetible.</p>

<p>Todo empieza en tu <code>TableSchema</code> y se replica de forma segura en cada operación SQL.
Así se evita la duplicidad, se facilita la evolución y se garantiza que cada fila cumpla exactamente la estructura esperada.</p>

<h2>Licencia</h2>
<p>MIT</p>

</body>
</html>
