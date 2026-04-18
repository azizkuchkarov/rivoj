-- Mavjud yozuvlarga ism bo‘yicha tartib bilan № berish
UPDATE "Teacher" AS t
SET "listNumber" = x.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "fullName" ASC) AS rn
  FROM "Teacher"
) AS x
WHERE t.id = x.id;
