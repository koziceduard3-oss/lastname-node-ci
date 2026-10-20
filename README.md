# Node.js у Docker із CI/CD

Навчальний Node.js-застосунок обслуговує сторінку dist/index.html, а /health перевіряє з'єднання з PostgreSQL. Dockerfile збирає застосунок на офіційному образі Node.js LTS, а docker-compose.yml запускає Node.js і PostgreSQL 15 разом.

## Локальний запуск у Docker Compose

Потрібні Docker Engine/Desktop із Compose v2. Для локального запуску:

~~~bash
docker compose up --build -d
docker compose ps
docker compose logs -f app db
~~~

Відкрийте http://localhost:3000/. Перевірка здоров'я застосунку й PostgreSQL: http://localhost:3000/health. Зупинити контейнери можна командою docker compose down; дані PostgreSQL залишаються у volume postgres_data. Щоб видалити також дані бази, додайте прапорець -v.

Локальні параметри можна скопіювати з .env.example у .env. Пароль local-only-password призначений лише для локального прикладу. На EC2 workflow створює випадковий пароль і зберігає його у .env на сервері; цей файл не передається з репозиторію.

## GitHub Actions: CI та збірка

Workflow .github/workflows/ci.yml запускається для push у main і pull request до main. Він установлює Node.js і залежності, збирає застосунок, перевіряє dist/index.html, запускає Node.js разом із PostgreSQL у Docker Compose та перевіряє маршрут /health. Збірка зберігається як artifact GitHub Actions.

## Деплой на Amazon EC2

Для push у main після успішних перевірок workflow виконує SSH-деплой незалежно від Docker Hub: відновлює приватний ключ із Base64, копіює вихідні файли на EC2 через rsync, установлює Docker Engine за потреби, запускає Docker Compose та перевіряє /health зсередини EC2. Docker Hub secrets не потрібні.

У репозиторії відкрийте Settings → Secrets and variables → Actions і створіть три repository secrets:

| Назва | Значення |
|---|---|
| EC2_HOST | Публічна IPv4-адреса або DNS-ім'я інстансу |
| EC2_USER | ubuntu для Ubuntu AMI |
| EC2_SSH_KEY_B64 | Приватний PEM-ключ, закодований у Base64 одним рядком |

У PowerShell однорядкове Base64-значення можна отримати локально так:

~~~powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('devops-key.pem'))
~~~

Не додавайте PEM-ключ у GitHub-репозиторій або звіт і не надсилайте його у відкритому вигляді. Збережіть лише Base64-значення в EC2_SSH_KEY_B64 у налаштуваннях Actions Secrets.

Security Group EC2 має дозволяти SSH (TCP 22) від GitHub Actions runner. IP-діапазони hosted runners змінюються; відкриття SSH для 0.0.0.0/0 полегшує тестування, але знижує безпеку. Для постійного використання обмежте джерело або використайте self-hosted runner чи AWS Systems Manager. Порт 3000 у цьому завданні відкривати не потрібно: workflow перевіряє застосунок на самому EC2. Для доступу до сайту з інтернету окремо дозвольте TCP 3000 у Security Group.

Після push відкрийте вкладку Actions і перевірте зелений запуск. Якщо секретів EC2 ще немає, CI та збірка пройдуть, а кроки деплою будуть пропущені з попередженням. Після додавання секретів повторний push у main виконає фактичний деплой.

EC2 може спричинити оплату залежно від ресурсів, регіону й доступного Free Tier/кредитів. Перевірте ліміт витрат свого AWS акаунта перед запуском інстансу.
