# Node.js CI/CD на Render і Supabase

Навчальний Node.js-застосунок обслуговує сторінку dist/index.html, а маршрут /health перевіряє PostgreSQL. Локально застосунок і PostgreSQL 15 запускаються через Docker Compose. У хмарі застосунок працює як Render Web Service, а база даних розміщується в Supabase.

## Локальний запуск у Docker Compose

Потрібні Docker Engine/Desktop із Compose v2:

~~~bash
docker compose up --build -d
docker compose ps
docker compose logs -f app db
~~~

Відкрийте http://localhost:3000/; перевірка застосунку й бази доступна на http://localhost:3000/health. Зупинити контейнери: docker compose down. Локальна конфігурація бере параметри PostgreSQL із Docker Compose; пароль local-only-password використовується лише для локального прикладу.

## GitHub Actions: CI

Workflow .github/workflows/ci.yml запускається після push у main, для pull request до main або вручну. Він збирає застосунок, перевіряє dist/index.html, запускає його разом із PostgreSQL у Docker Compose, перевіряє /health і зберігає артефакт збірки. Конфігурація Render задає autoDeployTrigger: checksPass, тому Render починає розгортання після успішних перевірок GitHub Actions.

## Налаштування Supabase

1. Створіть проєкт Supabase на Free plan і дочекайтеся готовності бази PostgreSQL.
2. У **Connect** виберіть **Session pooler** і скопіюйте connection string. Якщо в рядку є заповнювач пароля, підставте пароль, заданий під час створення проєкту.
3. Не додавайте connection string до GitHub, README чи коміту: він містить пароль до бази даних.

Застосунок читає **DATABASE_URL** і додає sslmode=require, якщо параметр ще відсутній. Для локального Docker Compose ця змінна не потрібна: використовуються стандартні PGHOST, PGPORT, PGDATABASE, PGUSER і PGPASSWORD.

## Налаштування Render

1. Увійдіть до Render через GitHub і відкрийте **New → Blueprint**.
2. Підключіть репозиторій koziceduard3-oss/lastname-node-ci; Render прочитає render.yaml у корені.
3. Залиште Web Service на плані **Free**. Коли Render попросить **DATABASE_URL**, вставте скопійований Session pooler connection string із Supabase. Зберігайте його лише в налаштуваннях Render.
4. Переконайтеся, що workflow GitHub Actions завершився успішно. Render збере Dockerfile та опублікує сервіс; його адресу покаже панель Render.
5. Відкрийте адресу сервісу і перевірте /health. Успішна відповідь: {"status":"ok","database":"connected"}.

Після налаштування кожен push у main запускає CI. Render розгортає нову версію після успішних CI checks. Змінні або ключі GitHub Actions для деплою не потрібні.

## Обмеження безкоштовних планів

- Безкоштовний Render Web Service засинає після 15 хвилин без трафіку; перший запит після цього може чекати близько хвилини. Вебсервіс може перезапускатися.
- Безкоштовна база Supabase має квоту 500 МБ і може бути призупинена після тижня низької активності; її можна відновити в Supabase Dashboard.
- Не використовуйте Render Free Postgres для цієї конфігурації: безкоштовні бази Render видаляються через 30 днів. У цьому проєкті PostgreSQL працює в Supabase.

Деталі: [Render Free Services](https://render.com/docs/free), [Supabase Free Plan](https://supabase.com/pricing), [Supabase Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing).
