# CI-node-demo

Невеликий Node.js-проєкт для практичного заняття з GitHub Actions. Скрипт `index.js` виводить `Hello world!`, а команда збірки створює `dist/index.html`.

## Локальний запуск

```bash
npm install
npm run build
```

Після збірки результат буде в каталозі `dist/`.

## CI

Workflow у `.github/workflows/ci.yml` запускається після кожного push у гілку `main`. Він установлює Node.js, виконує `npm install` і `npm run build`, перевіряє файл збірки та завантажує каталог `dist/` як артефакт.
