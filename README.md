<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>TS_ORM_LITE - Documentación</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2rem; max-width: 800px; }
    code, pre { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 4px; }
    pre { padding: 1rem; overflow-x: auto; }
    h1, h2, h3 { border-bottom: 1px solid #ddd; padding-bottom: 0.2rem; }
  </style>
</head>
<body>

<h1>TS_ORM_LITE</h1>

<h2>Descripción</h2>
<p><strong>TS_ORM_LITE</strong> es un micro ORM (Object-Relational Mapper) escrito en TypeScript.
Su objetivo es ofrecer una capa mínima, segura y tipada para interactuar con bases de datos MySQL usando <code>mysql2/promise</code>.
El foco principal es mantener la definición de la estructura de la base de datos en esquemas TypeScript (<code>TableSchema</code>) y garantizar el tipado de las filas (<code>Row&lt;T&gt;</code>) en todo el ciclo de vida.</p>

<h2>Esquema (TableSchema)</h2>
<p>Cada tabla se define con un objeto <code>TableSchema</code> que describe:</p>
<ul>
  <li>Nombre físico de la tabla.</li>
  <li>Definición de cada columna: tipo SQL, restricciones (<code>primaryKey</code>, <code>unique</code>, <code>nullable</code>, <code>default</code>).</li>
  <li>Claves foráneas opcionales para mantener integridad referencial.</li>
</ul>

<p><strong>Ejemplo básico</strong></p>
<pre><code>export const Users = {
  name: 'users',
  columns: {
    id: { name: 'id', sqlType: { type: 'INT' }, primaryKey: true, autoIncrement: true },
    username: { name: 'username', sqlType: { type: 'VARCHAR', length: 255 }, unique: true, nullable: false },
    email: { name: 'email', sqlType: { type: 'VARCHAR', length: 255 }, nullable: false },
    created_at: { name: 'created_at', sqlType: { type: 'DATETIME' }, default: 'CURRENT_TIMESTAMP' }
  },
  foreignKeys: {}
} satisfies TableSchema;</code></pre>

<h2>Interfaz Row&lt;T&gt;</h2>
<p>Cada tabla debe tener su interfaz <code>Row&lt;T&gt;</code>. Este contrato tipado representa la forma exacta de cada fila que se inserta o se lee de la base de datos.</p>

<p><strong>Ejemplo</strong></p>
<pre><code>export interface UsersRow {
  id: number;
  username: string;
  email: string;
  created_at: string;
}</code></pre>

<p>Así, cualquier operación <code>insert</code>, <code>find</code> o <code>update</code> del ORM siempre devuelve o consume datos coherentes.</p>

<h2>MiniOrm</h2>
<p>El núcleo de <code>TS_ORM_LITE</code> es la clase <code>MiniOrm</code>. Ofrece operaciones CRUD seguras y tipadas:</p>
<ul>
  <li><strong>createTable</strong>: Crea la tabla en MySQL a partir del <code>TableSchema</code>.</li>
  <li><strong>insert</strong>: Inserta registros, ignorando campos autoincrementales.</li>
  <li><strong>find</strong>: Consulta registros y devuelve <code>Row&lt;T&gt;[]</code>.</li>
  <li><strong>update</strong>: Actualiza registros usando criterios dinámicos.</li>
  <li><strong>delete</strong>: Elimina registros filtrados.</li>
  <li><strong>indexWithRelations</strong>: Permite SELECT con JOIN entre tablas y mapea la respuesta a estructuras anidadas.</li>
</ul>

<p>Todo está fuertemente tipado: lo que se define en el <code>TableSchema</code> y <code>Row&lt;T&gt;</code> es lo que se usa en cada consulta.</p>

<h2>Ejemplo de uso</h2>
<pre><code>const orm = new MiniOrm(pool);

// Crear tabla
await orm.createTable(Users);

// Insertar
await orm.insert(Users, [{ username: 'john', email: 'john@example.com' }]);

// Consultar
const { ormResult: users } = await orm.find&lt;UsersRow&gt;(Users, [{ field: 'id', operator: '=', value: 1 }]);</code></pre>

<h2>Manejo de respuestas</h2>
<p>Cada método devuelve:</p>
<ul>
  <li><code>rawQuery</code>: El SQL generado.</li>
  <li><code>rawResult</code>: El resultado sin procesar de <code>mysql2/promise</code>.</li>
  <li><code>ormResult</code>: El resultado mapeado y tipado.</li>
</ul>

<p>Los errores se manejan mediante filtros como <code>HttpExceptionFilter</code> o usando <code>InternalServerErrorException</code> en controladores <code>NestJS</code>.</p>

<h2>Estado actual</h2>
<ul>
  <li>CRUD básico (createTable, insert, find, update, delete)</li>
  <li>JOIN anidados (indexWithRelations)</li>
  <li>Esquemas 100% tipados</li>
  <li>Tipado <code>Row&lt;T&gt;</code> coherente entre entrada y salida</li>
  <li>Compatible con <code>NestJS</code></li>
</ul>

<h2>Ideas de evolución</h2>
<ul>
  <li>Generar migraciones automáticas comparando <code>TableSchema</code> con la base real.</li>
  <li>Soportar transacciones (BEGIN, COMMIT, ROLLBACK).</li>
  <li>Agregar validación de esquemas integrada.</li>
  <li>Extender soporte a otros motores (SQLite, PostgreSQL).</li>
  <li>Hooks (beforeInsert, afterUpdate).</li>
  <li>Generar documentación OpenAPI a partir de esquemas.</li>
  <li>Publicar como paquete npm.</li>
</ul>

<h2>Contribución</h2>
<p>Este proyecto es una base de aprendizaje y maduración de prácticas ORM personalizadas.  
Evolucionará según necesidades reales de desarrollo y escalado.</p>

<h2>Licencia</h2>
<p>MIT</p>

</body>
</html>
