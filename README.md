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
<p><strong>TS_ORM_LITE</strong> es un micro ORM escrito en TypeScript, con un enfoque 100% fuertemente tipado y modular.
Su diseño busca que toda la estructura de la base de datos, las consultas SQL y los contratos de datos estén alineados en un único flujo validado en tiempo de compilación.</p>

<p>La meta es minimizar la duplicidad de definiciones y garantizar que cada operación CRUD esté validada y documentada por el propio compilador TypeScript.</p>

<h2>¿Qué es el <code>Row&lt;T&gt;</code> y cómo se integra?</h2>

<p>El <code>Row&lt;T&gt;</code> es una interfaz TypeScript que representa la estructura exacta de una fila individual de la tabla en la base de datos.</p>

<p>Se genera de forma <strong>semi-automática</strong> mediante un script (por ejemplo, <code>Iorm.provider.ts</code>) que analiza todos los <code>TableSchema</code> definidos y produce las interfaces reales con tipos estrictos.</p>

<p>El desarrollador luego importa ese <code>Row&lt;T&gt;</code> y lo inyecta directamente en el <code>TableSchema&lt;T&gt;</code>.  
Esto hace que el esquema quede <strong>autocontenido</strong>: cada tabla sabe exactamente cómo luce cada fila.  
Por ejemplo:</p>

<pre><code>// Definición de esquema autocontenido
export const Users: TableSchema&lt;UsersRow&gt; = {
  name: 'users',
  columns: {
    id: { name: 'id', sqlType: { type: 'INT' }, primaryKey: true, autoIncrement: true },
    email: { name: 'email', sqlType: { type: 'VARCHAR', length: 255 }, unique: true }
  }
};

// Tipado generado (semi-automático)
export interface UsersRow {
  id: number;
  email: string;
}</code></pre>

<p>De esta forma, <strong>no es necesario pasar el tipo manualmente</strong> a cada operación del ORM.  
El <code>MiniOrm</code> usa internamente ese <code>&lt;T&gt;</code> para validar y autocompletar <strong>todas</strong> sus operaciones:
<code>insert</code>, <code>find</code>, <code>update</code>, <code>delete</code>, etc.</p>

<p>Esto garantiza que:</p>
<ul>
  <li>Los datos insertados respeten la estructura real de la tabla.</li>
  <li>Los resultados devueltos estén fuertemente tipados.</li>
  <li>El compilador avise de inmediato si se intenta insertar o actualizar un campo inexistente.</li>
</ul>

<p>Así, el esquema se convierte en la única fuente de verdad para la definición de la tabla <strong>y</strong> para su contrato de datos en todo el backend.</p>


<p>De este modo, el ORM devuelve y valida los datos exactamente como dicta la tabla real, ofreciendo autocompletado y validación automática en todo momento.</p>

<h3>¿Por qué se insertan manualmente en los esquemas?</h3>
<p>El diseño separa generación de tipos y definición de esquemas para que sea flexible y controlable.  
Una vez generado el archivo <code>Row&lt;T&gt;</code>, el desarrollador lo importa explícitamente en el esquema<code>&lt;T&gt;</code> esto ocacionara la retroalimentacion en los metods del orm, adicional puede usarlos en su módulo y lo asigna como tipo de retorno o entrada de cada operación del ORM, funciones, controladores etc.</p>

<p>Esto asegura que siempre se use la versión más reciente de la interfaz y permite que los controladores, servicios y validadores compartan la misma fuente de verdad.</p>

<h2>Inyección de conexión</h2>
<p>El <strong>MiniOrm</strong> necesita recibir explícitamente la conexión a base de datos (por ejemplo, un <code>Pool</code> de <code>mysql2/promise</code>) en el constructor:</p>

<pre><code>const orm = new MiniOrm(poolConnection);</code></pre>

<p>Esto permite desacoplar la capa ORM de la lógica de red o del framework (NestJS, Express, Fastify) y soportar inyección de pools, conexiones únicas o transacciones (en el futuro).</p>

<h2>Estado actual de funcionalidades</h2>
<p>Hoy en día, TS_ORM_LITE soporta:</p>
<ul>
  <li><strong>CRUD básico</strong>: <code>createTable</code>, <code>insert</code>, <code>find</code>, <code>update</code>, <code>delete</code>.</li>
  <li><strong>JOINS</strong>: <code>indexWithRelations</code> genera JOINs automáticos y mapea los resultados a estructuras anidadas tipadas.</li>
  <li><strong>Tipado fuerte en operaciones</strong>: mediante <code>Row&lt;T&gt;</code> generado por script.</li>
</ul>

<h2>Ideas a futuro</h2>
<p>Para madurar TS_ORM_LITE se planean varias extensiones importantes:</p>
<ol>
  <li><strong>Soporte para transacciones</strong>: permitir agrupar operaciones SQL dentro de bloques <code>BEGIN - COMMIT - ROLLBACK</code>.</li>
  <li><strong>Uniones avanzadas</strong>: soporte para <code>UNION</code> y <code>UNION ALL</code> con resultados también tipados.</li>
  <li><strong>Diseño modular de esquemas</strong>: centralizar todos los <code>TableSchema</code> en un solo módulo organizado, para facilitar mantenimiento.</li>
  <li><strong>Script de sincronización total</strong>:
    <ul>
      <li>Primera fase: consultar la base real y extraer metadatos de todas las tablas y claves foráneas.</li>
      <li>Segunda fase: generar automáticamente los <code>TableSchema</code> sin<code><T></code>.</li>
       <li>Tercera fase: Usar el script actual <code>Iorm.provider.ss</code> para generar las interfaces <code>&lt;T&gt;</code>.</li>
      <li>Cuarta fase: mapear y exportar todos los <code>Row&lt;T&gt;</code> actualizados de forma automatica.</li>
      <li>Quinta fase: sobreescribir los esquemas con los tipados actualizados, generando una sincronizacion y auto generacion de esquemas e interfaces de forma automatica, lo cual permitira al usuario mantener un control total de su db y tipado de forma automatica </li>
    </ul>
  </li>
</ol>

<h2>Retos técnicos</h2>
<p>Los principales desafíos que resolverá TS_ORM_LITE a medida que evolucione son:</p>
<ul>
  <li><strong>Organización automática</strong> de tablas según dependencias foráneas, para que no sea necesario definir manualmente el orden de creación.</li>
  <li><strong>Sincronización real bidireccional</strong>: asegurar que los cambios en la base o en los esquemas se reflejen sin contradicciones ni trabajo repetido.</li>
  <li><strong>Generación completa de tipos</strong> que cubra campos calculados, restricciones complejas y claves compuestas.</li>
  <li><strong>Script de sincronización robusto</strong> para combinar <code>CREATE TABLE</code>, actualización de claves foráneas y generación de interfaces de forma automática.</li>
</ul>

<h2>Conclusión</h2>
<p>TS_ORM_LITE establece una base clara para un ORM minimalista, predecible y 100% tipado en proyectos Node.js + TypeScript.</p>

<p>La clave es que cada operación SQL esté alineada 1:1 con un contrato de datos real, evitando inconsistencias y manteniendo la validación desde el esquema hasta el controlador.</p>

<p>El objetivo es que toda esta potencia sea <strong>totalmente automática</strong>: defines tu tabla, corres el script, importas el <code>Row&lt;T&gt;</code> y el resto es controlado por el compilador y el ORM.</p>

<h2>Licencia</h2>
<p>MIT</p>

</body>
</html>
