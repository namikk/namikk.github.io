# Interactive Migration Map of Europe

This small project is the result of a homework assignment I had last semester for the Information Visualization and Visual Analytics course.

I used SVG HTML elements to visualize the migration data on top of a map of Europe (also drawn with SVG). Migration data was provided by the course instructors.

Frameworks/libraries used:
* jQuery https://jquery.com/
* jVectorMap http://jvectormap.com/
* D3.js https://d3js.org/
* Bootstrap http://getbootstrap.com/

Usage/controls:
* mouse scroll - zoom in/out
* left mouse click or middle mouse click on non-country map area & drag - pan map
* mouse left click on a country - show migration data for that country (single selection)
* hold ctrl/shift while clicking on countries - show migration data for multiple countries (multi selection)
* left mouse click on non-country map area - clear selection