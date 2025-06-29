-- Table: public.sensores

-- DROP TABLE IF EXISTS public.sensores;

CREATE TABLE IF NOT EXISTS public.sensores
(
    id serial NOT NULL,
    momento_registro timestamp(3) with time zone NOT NULL,
    temperatura numeric(8,6),
    luminosidade numeric(4,0),
    umidade_ar numeric(2,0),
    umidade_solo numeric(4,0),
    CONSTRAINT "SENSORES_pkey" PRIMARY KEY (id)
)
TABLESPACE pg_default;

CREATE INDEX idx_sensores_timestamp ON public.sensores (momento_registro);

ALTER TABLE IF EXISTS public.sensores
    OWNER to luc;

REVOKE ALL ON TABLE public.sensores FROM douglas;

GRANT SELECT, INSERT, DELETE ON TABLE public.sensores TO douglas;
GRANT USAGE, SELECT ON SEQUENCE public.sensores_id_seq TO douglas;

GRANT ALL ON TABLE public.sensores TO luc;


CREATE OR REPLACE VIEW public.vw_avg_last_30_seconds AS
SELECT
  AVG(temperatura)      AS avg_temperatura,
  AVG(luminosidade)     AS avg_luminosidade,
  AVG(umidade_ar)       AS avg_umidade_ar,
  AVG(umidade_solo)     AS avg_umidade_solo,
  MAX(momento_registro) AS last_momento_registro
FROM public.sensores
WHERE momento_registro >= NOW() - INTERVAL '30 seconds';

ALTER VIEW IF EXISTS vw_avg_last_30_seconds
    OWNER to luc;

REVOKE ALL ON TABLE vw_avg_last_30_seconds FROM douglas;
GRANT SELECT ON TABLE vw_avg_last_30_seconds TO douglas;
GRANT ALL ON TABLE vw_avg_last_30_seconds TO luc;


-- Table: public.target

-- DROP TABLE IF EXISTS public.target;

CREATE TABLE IF NOT EXISTS public.target
(
    id serial NOT NULL,
    temperatura numeric(2,0),
    luminosidade numeric(4,0),
    umidade_ar numeric(2,0),
    umidade_solo numeric(4,0),
    CONSTRAINT "TARGET_pkey" PRIMARY KEY (id)
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.target
    OWNER to luc;

REVOKE ALL ON TABLE public.target FROM douglas;

GRANT SELECT, INSERT, DELETE ON TABLE public.target TO douglas;
GRANT USAGE, SELECT ON SEQUENCE public.target_id_seq TO douglas;

GRANT ALL ON TABLE public.target TO luc;
