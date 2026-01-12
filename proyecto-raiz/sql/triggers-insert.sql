<<<<<<< HEAD
USE TimeUp;
DELIMITER $$

CREATE TRIGGER tr_prevenir_borrado_ultimo_admin
BEFORE DELETE ON usuarios 
FOR EACH ROW
BEGIN
    DECLARE v_grupos_administrados INT DEFAULT 0;

    SELECT COUNT(DISTINCT ug.id_grupo)
    INTO v_grupos_administrados
    FROM usuarios_grupos ug
    WHERE ug.id_usuario = OLD.id_usuario
      AND ug.rol_en_grupo = 'administrador'
      AND (
          SELECT COUNT(*)
          FROM usuarios_grupos ug2
          WHERE ug2.id_grupo = ug.id_grupo
            AND ug2.rol_en_grupo = 'administrador'
            AND ug2.id_usuario != OLD.id_usuario
      ) = 0;

    IF v_grupos_administrados > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: No se puede eliminar. El usuario es el último administrador de uno o más grupos. Transfiera la propiedad primero.';
    END IF;
END$$

CREATE TRIGGER tr_check_roles_insert
BEFORE INSERT ON usuarios_grupos
FOR EACH ROW
BEGIN
    DECLARE v_admin_count INT;

    IF NEW.rol_en_grupo = 'administrador' THEN
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = NEW.id_grupo AND rol_en_grupo = 'administrador';

        IF v_admin_count >= 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: El grupo ya tiene el máximo de 2 administradores.';
        END IF;
    END IF;
END$$

CREATE TRIGGER tr_check_roles_update
BEFORE UPDATE ON usuarios_grupos
FOR EACH ROW
BEGIN
    DECLARE v_admin_count INT;

    IF NEW.rol_en_grupo = 'administrador' AND OLD.rol_en_grupo != 'administrador' THEN
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = NEW.id_grupo AND rol_en_grupo = 'administrador';

        IF v_admin_count >= 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: No se puede ascender. El grupo ya tiene el máximo de 2 administradores.';
        END IF;
    END IF;

    IF OLD.rol_en_grupo = 'administrador' AND NEW.rol_en_grupo != 'administrador' THEN
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = OLD.id_grupo
          AND rol_en_grupo = 'administrador'
          AND id_usuario != OLD.id_usuario; 

        IF v_admin_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: No se puede degradar. El grupo debe tener al menos un administrador.';
        END IF;
    END IF;
END$$

CREATE TRIGGER tr_prevenir_expulsion_ultimo_admin
BEFORE DELETE ON usuarios_grupos
FOR EACH ROW
BEGIN
    DECLARE v_admin_count INT;
    
    IF OLD.rol_en_grupo = 'administrador' THEN
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = OLD.id_grupo 
          AND rol_en_grupo = 'administrador'
          AND id_usuario != OLD.id_usuario;
          
        IF v_admin_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: No se puede expulsar/salir. El grupo debe tener al menos un administrador.';
        END IF;
    END IF;
END$$

=======
USE TimeUp;
DELIMITER $$

CREATE TRIGGER tr_prevenir_borrado_ultimo_admin
BEFORE DELETE ON usuarios 
FOR EACH ROW
BEGIN
    DECLARE v_grupos_administrados INT DEFAULT 0;

    SELECT COUNT(DISTINCT ug.id_grupo)
    INTO v_grupos_administrados
    FROM usuarios_grupos ug
    WHERE ug.id_usuario = OLD.id_usuario
      AND ug.rol_en_grupo = 'administrador'
      AND (
          SELECT COUNT(*)
          FROM usuarios_grupos ug2
          WHERE ug2.id_grupo = ug.id_grupo
            AND ug2.rol_en_grupo = 'administrador'
            AND ug2.id_usuario != OLD.id_usuario
      ) = 0;

    IF v_grupos_administrados > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: No se puede eliminar. El usuario es el último administrador de uno o más grupos. Transfiera la propiedad primero.';
    END IF;
END$$

CREATE TRIGGER tr_check_roles_insert
BEFORE INSERT ON usuarios_grupos
FOR EACH ROW
BEGIN
    DECLARE v_admin_count INT;

    IF NEW.rol_en_grupo = 'administrador' THEN
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = NEW.id_grupo AND rol_en_grupo = 'administrador';

        IF v_admin_count >= 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: El grupo ya tiene el máximo de 2 administradores.';
        END IF;
    END IF;
END$$

CREATE TRIGGER tr_check_roles_update
BEFORE UPDATE ON usuarios_grupos
FOR EACH ROW
BEGIN
    DECLARE v_admin_count INT;

    IF NEW.rol_en_grupo = 'administrador' AND OLD.rol_en_grupo != 'administrador' THEN
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = NEW.id_grupo AND rol_en_grupo = 'administrador';

        IF v_admin_count >= 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: No se puede ascender. El grupo ya tiene el máximo de 2 administradores.';
        END IF;
    END IF;

    IF OLD.rol_en_grupo = 'administrador' AND NEW.rol_en_grupo != 'administrador' THEN
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = OLD.id_grupo
          AND rol_en_grupo = 'administrador'
          AND id_usuario != OLD.id_usuario; 

        IF v_admin_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: No se puede degradar. El grupo debe tener al menos un administrador.';
        END IF;
    END IF;
END$$

CREATE TRIGGER tr_prevenir_expulsion_ultimo_admin
BEFORE DELETE ON usuarios_grupos
FOR EACH ROW
BEGIN
    DECLARE v_admin_count INT;
    
    IF OLD.rol_en_grupo = 'administrador' THEN
        SELECT COUNT(*) INTO v_admin_count
        FROM usuarios_grupos
        WHERE id_grupo = OLD.id_grupo 
          AND rol_en_grupo = 'administrador'
          AND id_usuario != OLD.id_usuario;
          
        IF v_admin_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: No se puede expulsar/salir. El grupo debe tener al menos un administrador.';
        END IF;
    END IF;
END$$

>>>>>>> 3839f8b1b26d8fd42ed888572b0a3fbc7650862e
DELIMITER ;