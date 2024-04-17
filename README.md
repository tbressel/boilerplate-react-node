# Boilerplate REACT JS / NODE JS

-------

Cette base d'application est développer pour la préparation de différents projets pouvant utiliser les mêmes fonctions de base. Elle n'inclue donc aucune logique métier.


## FRONT-END

--------------------------

__Dossier ./client__

Application React JS / Typescript et Styled Components.

* __npm run start__ : démarrer la partie front de l'application en local.
* __npm run build__ : compiler le front end dans un dossier __./client/build__


## BACK-END

--------------------------

__1. API Rest__

__Dossier ./server__

Serveur Node JS / Express / Javascript (upgrade prevu en Typescript)

* __npm run dev__ : démarrer le serveur en local

__2. Base de données__

__Dossier ./database__

Base de donnée mySQL

Un fichier SQL est archivé permettant d'être importé dans phpmyadmin, pour développer en local,  
ainsi que la présence de fichier Lopping correspondant au MCD de la basse de données

Base de donnée Redis

Le code à été pour le comment désactivé/commenté suite à l'annonce du changement de license de Redis.  
A voir si je vais prolonger son utilisation ou si je vais switcher vers Redict, la version open source de Redis.

