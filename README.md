# Plank Statistics

### Local

Add the .env.local and pull the develop branch

`git switch -c feat/nome-branch develop`

Dal nuovo branch

`npm run dev`

### Release su dev

Solo su branch **develop**

`npm run build`

### Release in prod

Solo su branch **main**

`git pull`

`npm run release`

`git add .`

`git commit -m "RELEASE"`

`git push`

`git tag vx.x.x`

`git push origin vx.x.x`

su Page Events:

modificare la versione in snippet.php e index.html

`git add .`

`git commit -m "feat(statistics): update version"`

`git push`

### Note

Esiste un branch development ma non viene più utilizzato, tenuto per tracking ecc... Usare solo develop come branch di sviluppo

Documentazione completa [qui](https://github.com/plankplatform/technical-documentation/tree/main/Plank%20Statistics)
