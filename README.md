# RacketRating Calculator

Statische calculator met zes sporten en drie weergaven: Berekenen, Opgeslagen en Uitleg.

- `index.html`: structuur, navigatie en uitleg.
- `style.css`: responsive scherm- en printweergave.
- `app.js`: bestaande rekenmodellen, formulieren en lokale historie.

Geen dependencies of build nodig. Serveer de map met een statische HTTP-server.

Tennis en pickleball ondersteunen enkel- en dubbelspel; padel ondersteunt dubbelspel. Optionele scores, wedstrijdgewicht, namen, lokale opslag (maximaal 80 resultaten), CSV-export en printen blijven beschikbaar. De bestaande localStorage-sleutel is behouden.

De calculator is een onafhankelijk hulpmiddel. De rekenmodellen zijn bij het herontwerp behouden; dit is geen nieuwe validatie van de officiële bondsregels.

Validatie van het herontwerp: 36 vergelijkings- en invoercontroles tegen de vorige rekenlogica, browserberekeningen voor alle zes sporten, opslaan en historie, invoerwijziging na een resultaat en mobiele weergave op 390px.
