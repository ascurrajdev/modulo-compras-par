import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComprasTables1717272000000 implements MigrationInterface {
  name = 'CreateComprasTables1717272000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id_proveedor BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        descripcion VARCHAR(200) NOT NULL,
        ruc VARCHAR(15) NOT NULL,
        estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
        fecha_registro TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id_proveedor),
        UNIQUE KEY uq_proveedores_ruc (ruc),
        KEY idx_proveedores_estado (estado),
        KEY idx_proveedores_descripcion (descripcion)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS proveedor_direcciones (
        id_direccion BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        id_proveedor BIGINT UNSIGNED NOT NULL,
        departamento VARCHAR(100) NOT NULL,
        ciudad VARCHAR(100) NOT NULL,
        barrio VARCHAR(150) NULL,
        calle_principal VARCHAR(200) NOT NULL,
        calle_secundaria VARCHAR(200) NULL,
        numero VARCHAR(20) NULL,
        referencia VARCHAR(300) NULL,
        latitud DECIMAL(10, 7) NULL,
        longitud DECIMAL(10, 7) NULL,
        estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
        PRIMARY KEY (id_direccion),
        KEY idx_proveedor_direcciones_proveedor_estado (id_proveedor, estado),
        CONSTRAINT fk_proveedor_direcciones_proveedor
          FOREIGN KEY (id_proveedor) REFERENCES proveedores (id_proveedor)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS proveedor_contactos (
        id_contacto BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        id_proveedor BIGINT UNSIGNED NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        cargo VARCHAR(100) NULL,
        email VARCHAR(150) NOT NULL,
        telefono_principal VARCHAR(20) NOT NULL,
        telefono_secundario VARCHAR(20) NULL,
        es_principal BOOLEAN NOT NULL DEFAULT FALSE,
        estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
        PRIMARY KEY (id_contacto),
        KEY idx_proveedor_contactos_proveedor_estado (id_proveedor, estado),
        KEY idx_proveedor_contactos_principal (id_proveedor, es_principal),
        KEY idx_proveedor_contactos_email (email),
        CONSTRAINT fk_proveedor_contactos_proveedor
          FOREIGN KEY (id_proveedor) REFERENCES proveedores (id_proveedor)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS solicitudes_compra (
        id_solicitud BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        numero_referencia VARCHAR(30) NOT NULL,
        id_proveedor BIGINT UNSIGNED NOT NULL,
        descripcion VARCHAR(200) NULL,
        estado ENUM('PENDIENTE', 'APROBADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
        subtotal_iva5 DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        subtotal_iva10 DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        subtotal_exenta DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        monto_total DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        fecha_creacion TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        fecha_req_entrega DATE NULL,
        PRIMARY KEY (id_solicitud),
        UNIQUE KEY uq_solicitudes_compra_numero_referencia (numero_referencia),
        KEY idx_solicitudes_compra_proveedor (id_proveedor),
        KEY idx_solicitudes_compra_estado_fecha (estado, fecha_creacion),
        CONSTRAINT fk_solicitudes_compra_proveedor
          FOREIGN KEY (id_proveedor) REFERENCES proveedores (id_proveedor)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS solicitudes_compra_detalles (
        id_detalle BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        id_solicitud BIGINT UNSIGNED NOT NULL,
        producto_id VARCHAR(50) NOT NULL,
        producto_nombre VARCHAR(200) NOT NULL,
        cantidad INT UNSIGNED NOT NULL,
        precio_unitario DECIMAL(15, 2) NOT NULL,
        iva5 DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        iva10 DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        exenta DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        PRIMARY KEY (id_detalle),
        KEY idx_solicitudes_compra_detalles_solicitud (id_solicitud),
        KEY idx_solicitudes_compra_detalles_producto (producto_id),
        CONSTRAINT fk_solicitudes_compra_detalles_solicitud
          FOREIGN KEY (id_solicitud) REFERENCES solicitudes_compra (id_solicitud)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS autorizaciones_compra (
        id_autorizacion BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        id_solicitud BIGINT UNSIGNED NOT NULL,
        estado ENUM(
          'PENDIENTE_ENVIO',
          'ENVIANDO',
          'EN_PROCESO',
          'APROBADA',
          'RECHAZADA',
          'ERROR_KAFKA'
        ) NOT NULL DEFAULT 'PENDIENTE_ENVIO',
        kafka_message_id VARCHAR(60) NULL,
        fecha_envio_kafka TIMESTAMP(3) NULL,
        fecha_respuesta_caja TIMESTAMP(3) NULL,
        resultado_caja ENUM('APROBADA', 'RECHAZADA') NULL,
        observacion VARCHAR(500) NULL,
        PRIMARY KEY (id_autorizacion),
        UNIQUE KEY uq_autorizaciones_compra_solicitud (id_solicitud),
        KEY idx_autorizaciones_compra_estado (estado),
        KEY idx_autorizaciones_compra_resultado_caja (resultado_caja),
        KEY idx_autorizaciones_compra_kafka_message_id (kafka_message_id),
        CONSTRAINT fk_autorizaciones_compra_solicitud
          FOREIGN KEY (id_solicitud) REFERENCES solicitudes_compra (id_solicitud)
          ON UPDATE CASCADE
          ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO proveedores (id_proveedor, descripcion, ruc, estado, fecha_registro)
      VALUES (1, 'Distribuidora Nandu S.A.', '80123456-7', 'ACTIVO', '2026-04-11 10:00:00.000')
      ON DUPLICATE KEY UPDATE id_proveedor = id_proveedor
    `);

    await queryRunner.query(`
      INSERT INTO proveedor_direcciones (
        id_direccion,
        id_proveedor,
        departamento,
        ciudad,
        barrio,
        calle_principal,
        calle_secundaria,
        numero,
        referencia,
        latitud,
        longitud,
        estado
      )
      VALUES (
        1,
        1,
        'Central',
        'Luque',
        'Villa Aurelia',
        'Mcal. Estigarribia',
        NULL,
        '1450',
        'Frente al mercado',
        -25.2367000,
        -57.4789000,
        'ACTIVO'
      )
      ON DUPLICATE KEY UPDATE id_direccion = id_direccion
    `);

    await queryRunner.query(`
      INSERT INTO proveedor_contactos (
        id_contacto,
        id_proveedor,
        nombre,
        apellido,
        cargo,
        email,
        telefono_principal,
        telefono_secundario,
        es_principal,
        estado
      )
      VALUES (
        1,
        1,
        'Carlos',
        'Vera',
        'Gerente Comercial',
        'cvera@nandu.com.py',
        '+595981123456',
        NULL,
        TRUE,
        'ACTIVO'
      )
      ON DUPLICATE KEY UPDATE id_contacto = id_contacto
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS autorizaciones_compra');
    await queryRunner.query('DROP TABLE IF EXISTS solicitudes_compra_detalles');
    await queryRunner.query('DROP TABLE IF EXISTS solicitudes_compra');
    await queryRunner.query('DROP TABLE IF EXISTS proveedor_contactos');
    await queryRunner.query('DROP TABLE IF EXISTS proveedor_direcciones');
    await queryRunner.query('DROP TABLE IF EXISTS proveedores');
  }
}
