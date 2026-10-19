# Node.js у Docker із CI/CD

Навчальний застосунок Node.js обслуговує сторінку `dist/index.html`, а `/health` перевіряє з'єднання з PostgreSQL. `Dockerfile` збирає застосунок на офіційному `node:lts`, а `docker-compose.yml` запускає Node.js і PostgreSQL 15 разом.

## Локальний запуск у Docker Compose

Потрібні Docker Engine/Desktop із Compose v2. Для локального запуску:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f app db
```

Відкрийте <http://localhost:3000/>. Перевірка здоров'я застосунку й PostgreSQL: <http://localhost:3000/health>. Зупинити контейнери можна командою `docker compose down`; дані PostgreSQL залишаються у volume `postgres_data`. Щоб видалити й дані бази, додайте `-v`.

Локальні параметри можна скопіювати з `.env.example` у `.env`. Пароль `local-only-password` призначений лише для локального прикладу; на EC2 workflow створює окремий випадковий пароль і зберігає його в `.env` на сервері.

## Dockerfile та тег коміту

Залежності встановлюються після копіювання `package*.json`, а решта проєкту — окремим шаром, щоб Docker міг кешувати встановлення. Для ручної збірки образу з коротким хешем останнього коміту:

```bash
git rev-parse --short HEAD
docker build -t <dockerhub-username>/nodeapp:<git-hash> .
```

Файл `.dockerignore` виключає `node_modules`, `.env`, Git-історію та згенерований `dist/` із build context.

## GitHub Actions

`.github/workflows/ci.yml` запускається на кожний push у `main`. Він установлює Node.js і залежності, виконує `npm run build`, перевіряє артефакт збірки, а потім збирає Docker-образ із тегами гілки, короткого commit SHA та `latest`. Для публікації в Docker Hub у **Settings → Secrets and variables → Actions** додайте repository secrets:

- `DOCKERHUB_USERNAME` — ім'я користувача Docker Hub;
- `DOCKERHUB_TOKEN` — Docker Hub access token із правом запису.

Якщо їх ще немає, перевірки та збірка образу все одно проходять, а workflow показує попередження, що публікацію пропущено.

## Деплой на EC2

Після публікації образу workflow може завантажити `docker-compose.yml` на EC2, установити Docker Engine/Compose за відсутності, прибрати старий контейнер `nodeapp` та процес PM2 `nodeapp`, і запустити новий контейнер разом із PostgreSQL. Для цього додайте такі repository secrets:

- `EC2_HOST` — публічна IP-адреса або DNS-ім'я EC2;
- `EC2_USER` — SSH-користувач, наприклад `ubuntu` для Ubuntu AMI;
- `EC2_SSH_KEY_B64` — приватний SSH-ключ у Base64.

Для підключення застосунку ззовні у Security Group EC2 потрібен inbound TCP port 3000. PostgreSQL у Compose прив'язаний лише до loopback інтерфейсу EC2. Переконайтеся, що інстанс і пов'язаний із ним трафік не перевищують ваш AWS Free Tier/кредити; тарифи залежать від акаунта й ресурсів.

Збірка образу та публікація в Docker Hub не створюють EC2-ресурси. Саме EC2 може нараховувати вартість, тож створіть його окремо в межах дозволеного вам ліміту.
