USE TimeUp;
-- Cambiamos el delimitador de ';' a '$$' para poder escribir bloques de código (BEGIN...END) sin que SQL piense que ha terminado la instrucción.
DELIMITER $$

-- =====================================================
--  TRIGGER 1: Seguridad de Usuarios
--  Impide borrar un usuario si es el ÚNICO administrador de algún grupo.
-- =====================================================
CREATE TRIGGER tr_prevenir_borrado_ultimo_admin
BEFORE DELETE ON usuarios -- Se ejecuta ANTES de borrar
FOR EACH ROW
BEGIN
    DECLARE v_grupos_administrados INT DEFAULT 0;

    -- Cuenta en cuántos grupos este usuario es 'administrador' Y es el único 'administrador'.
    SELECT COUNT(DISTINCT ug.id_grupo)
    INTO v_grupos_administrados
    FROM usuarios_grupos ug
    WHERE ug.id_usuario = OLD.id_usuario
      AND ug.rol_en_grupo = 'administrador'
      AND (
          -- Subconsulta: Verifica si hay OTROS admins en ese mismo grupo
          SELECT COUNT(*)
          FROM usuarios_grupos ug2
          WHERE ug2.id_grupo = ug.id_grupo
            AND ug2.rol_en_grupo = 'administrador'
            AND ug2.id_usuario != OLD.id_usuario
      ) = 0;

    -- Si el contador es mayor a 0, lanzamos error y cancelamos el borrado.
    IF v_grupos_administrados > 0 THEN
        SIGNAL SQLSTATE '45000' -- Código estándar para excepciones de usuario
        SET MESSAGE_TEXT = 'Error: No se puede eliminar. El usuario es el último administrador de uno o más grupos. Transfiera la propiedad primero.';
    END IF;
END$$

-- =====================================================
--  TRIGGER 2: Control de Límites (INSERT)
--  Impide añadir un administrador si ya existen 2 en el grupo.
-- =====================================================
CREATE TRIGGER tr_check_roles_insert
BEFORE INSERT ON usuarios_grupos
FOR EACH ROW
BEGIN
    DECLARE v_admin_count INT;

    -- Solo nos importa si intentan insertar un 'administrador'
    IF NEW.rol_en_grupo = 'administrador' THEN
        -- Contamos cuántos admins tiene ya el grupo
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = NEW.id_grupo AND rol_en_grupo = 'administrador';

        -- Si ya hay 2 o más, bloqueamos la inserción.
        IF v_admin_count >= 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: El grupo ya tiene el máximo de 2 administradores.';
        END IF;
    END IF;
END$$

-- =====================================================
--  TRIGGER 3: Control de Cambios de Rol (UPDATE)
--  Maneja ascensos (miembro -> admin) y descensos (admin -> miembro).
-- =====================================================
CREATE TRIGGER tr_check_roles_update
BEFORE UPDATE ON usuarios_grupos
FOR EACH ROW
BEGIN
    DECLARE v_admin_count INT;

    -- ASCENSO (Alguien se vuelve administrador)
    IF NEW.rol_en_grupo = 'administrador' AND OLD.rol_en_grupo != 'administrador' THEN
        -- Verificamos que no se exceda el límite de 2.
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = NEW.id_grupo AND rol_en_grupo = 'administrador';

        IF v_admin_count >= 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: No se puede ascender. El grupo ya tiene el máximo de 2 administradores.';
        END IF;
    END IF;

    -- DESCENSO (Un administrador deja de serlo)
    IF OLD.rol_en_grupo = 'administrador' AND NEW.rol_en_grupo != 'administrador' THEN
        -- Verificamos si quedan otros administradores aparte de él.
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = OLD.id_grupo
          AND rol_en_grupo = 'administrador'
          AND id_usuario != OLD.id_usuario; -- Excluimos al usuario actual

        -- Si no queda nadie más, prohibimos el descenso.
        IF v_admin_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: No se puede degradar. El grupo debe tener al menos un administrador.';
        END IF;
    END IF;
END$$

-- =====================================================
--  TRIGGER 4: Control de Salidas (DELETE en usuarios_grupos)
--  Impide que un admin se salga del grupo si es el último.
-- =====================================================
CREATE TRIGGER tr_prevenir_expulsion_ultimo_admin
BEFORE DELETE ON usuarios_grupos
FOR EACH ROW
BEGIN
    DECLARE v_admin_count INT;
    
    -- Si el que se va es administrador
    IF OLD.rol_en_grupo = 'administrador' THEN
        -- Contamos cuántos admins quedan (excluyendo al que se va)
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = OLD.id_grupo 
          AND rol_en_grupo = 'administrador'
          AND id_usuario != OLD.id_usuario;
          
        -- Si no queda ninguno, error.
        IF v_admin_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: No se puede expulsar/salir. El grupo debe tener al menos un administrador.';
        END IF;
    END IF;
END$$

-- Volvemos al delimitador normal.
DELIMITER ;