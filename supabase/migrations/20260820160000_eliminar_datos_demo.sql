-- Elimina TODOS los datos de relleno del andamiaje original
-- ---------------------------------------------------------------------------
-- El proyecto se genero con contenido de muestra: 30 "Embajadora Demo NN", 18
-- ediciones de tema inventado, 6 patrocinadores "(Ejemplo)" y 6 historias de
-- plantilla. Nada de eso corresponde a personas, ferias ni acuerdos reales.
--
-- Las embajadoras REALES viven en PatrimoniOS y el sitio solo las lee de alli:
-- Archivo de Mis Flores nunca escribe en PatrimoniOS. Esta base guarda usuarios,
-- roles, municipios y decisiones editoriales — no fichas de personas.
--
-- `municipalities` (17) NO se toca: son los municipios reales de Tabasco y de
-- ahi sale la region con la que se colorea cada embajadora en todo el sitio.

-- 1) Embajadoras de relleno. Arrastra en cascada representations (30),
--    recognitions (30), family_relationships (15) y media_people (0).
--    Deja en NULL stories.related_person_id y media_assets.person_id.
DELETE FROM public.people
WHERE full_name LIKE 'Embajadora Demo %';

-- 2) Historias de plantilla.
DELETE FROM public.stories;

-- 3) Patrocinadores ilustrativos: todos los sembrados llevan status 'ejemplo'.
DELETE FROM public.sponsors
WHERE status = 'ejemplo';

-- 4) Ediciones de muestra. Se hace AL FINAL porque representations y
--    recognitions las referencian con ON DELETE CASCADE y ya se fueron con el
--    paso 1. Los anos reales de participacion vienen de PatrimoniOS, del campo
--    de ficha `ano_de_participacion`.
DELETE FROM public.editions;

-- Comprobacion: si algo quedo, esta consulta lo delata.
--   SELECT 'people' t, count(*) FROM public.people
--   UNION ALL SELECT 'editions', count(*) FROM public.editions
--   UNION ALL SELECT 'stories', count(*) FROM public.stories
--   UNION ALL SELECT 'sponsors', count(*) FROM public.sponsors
--   UNION ALL SELECT 'municipalities', count(*) FROM public.municipalities;
