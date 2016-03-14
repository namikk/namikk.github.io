///
///-----------
///
/// TODOs
///
///-----------
///

  //maybe todo
  //prevent drag panning with left mouse button (would prolly require jvectormap library editing)

  //todo
  //change color of unselectable countries

  //todo
  //change color of currently selected countries

  //maybe todo
  //maybe bugfix
  //prevent multiple line drawing on a single country

  //todo
  //left click to select/deselect country migration lines
  
  //todo
  //select all timesteps

  //todo bugfix
  //setAttribute & toLower colled when deselecting by clicking on lines

  //todo
  //arrow keys left/right map movement

  //todo
  //group overlapping pie charts;
  //zooming in separates the group into smaller pieces that do not overlap; 
  //zooming out combines smaller pie charts that would otherwise overlap;

  //maybe todo
  //animate line drawing

///
///-----------
///
/// Variables and Data Structures
///
///-----------
///

function MigrationDataPoint() {
  var source_id = 0;
  var target_id = 0;
  var weight = 0;
};

function Country() {
  var id = 0;//country id as seen in the dataset
  var code = "";//country code as used by jVectorMap
  var fullName = "";//full country name
  var coords = [];//predefined country center (not working)
  var element = null;//corresponding html element
  //total migration values (all timesteps)
  var totalIn = 0;
  var totalOut = 0;
  var totalPop = 0;
  //holds the emigration data for this country (all timesteps)
  var countryEmigrationData = [];
  //holds the immigration data for this country (all timesteps)
  var countryImmigrationData = [];
};

//total migration amount for current time step
var totalMigration = 0;
//maximum individual country migration value
var maxMigrationValue = 0;
//tooltip div
var tooltipDiv = null;
//holds all pie charts
var allPieCharts = [];
//holds all drawn lines..duh
var allLines = [];
//holds the main svg element
var theSVG = null;
//holds the svg map element
var theMap = null;
//holds all the data about all the countries
var countries = [];
//holds migration data
var migrationMatrix = [];
//holds the country names (from the data...)
var nodes = [];
//tracks the current timeStep
var currentTimeStep = 0;
//tracks the svg elements of currently selected countries
var selectedCountryElements = [];
//display emigration lines
var showEmigration = true;
//display immigration lines
var showImmigration = true;
//minimum migration line width
var minLineWidth = 1;
//toggle usage of minimum migration line width
var useMinimumLineWidth = false;

///
///-----------
///
/// Entry Point
///
///-----------
///

function init() {
  initData();
  addClickListeners();
  calculateMigratioValues();
  drawPieCharts();
};

///
///-----------
///
/// Visualization Flow Control
///
///-----------
///

function toggleMinimumLineWidth() {
  useMinimumLineWidth = !useMinimumLineWidth;
  reDrawSelectedCountryLines();
}

function toggleEmigration() {
  showEmigration = !showEmigration;
  reDrawSelectedCountryLines();
};

function toggleImmigration() {
  showImmigration = !showImmigration;
  reDrawSelectedCountryLines();
};

function calculateMigratioValues(){
  totalMigration = 0;
  maxMigrationValue = 0;
  for (var c in countries) {
    currentTotalMigration = Number(countries[c].totalPop[currentTimeStep]);
    if(currentTotalMigration > maxMigrationValue) {
      maxMigrationValue = currentTotalMigration;
    }
    totalMigration += currentTotalMigration;
  }
};

function setTimeStep(timeStep){
  currentTimeStep = timeStep;
  if(timeStep == -1) {
    currentTimeStep = 0;
  }

  calculateMigratioValues();
  reDrawSelectedCountryLines();
  clearPieCharts();
  drawPieCharts();
};

function clearLines(){
  for(var path in allLines){
    allLines[path].remove();
  }
  allLines = [];
};

function clearSelected(){
  for(var elementIndex in selectedCountryElements){
    selectedCountryElements[elementIndex].setAttribute("selected", "false");
    selectedCountryElements = [];
  }

};

function reDrawSelectedCountryLines(){
  clearLines();
  for (var elementIndex in selectedCountryElements) {
    drawCountryLines(selectedCountryElements[elementIndex]);
  }
};

function clearPieCharts() {
  for(var pieChartIndex in allPieCharts){
    allPieCharts[pieChartIndex].remove();
  }
  allPieCharts = [];
}

///
///-----------
///
/// Data & Variable Init //Highly unoptimized
///
///-----------
///

function populateMigrationMatrix(){
  var dataSplit = migrationData.split("\n");

  var dataPosition = 0;

  for(var i = 0; i < dataSplit.length; i++){
    nodes[i] = dataSplit[i];
    dataPosition++;
    if(dataSplit[i] == ""){
      break;
    }
  }

  //timestep = one row in migrationMatrix
  var dataPointCounter = 0;
  var timeStepCounter = 0;
  migrationMatrix = [];
  migrationMatrix[timeStepCounter] = [];
  for(var i = dataPosition; i < dataSplit.length - 1; i++){

    if(dataSplit[i] == ""){//new timestep
      timeStepCounter++;//increase the timeStepCounter
      dataPointCounter = 0;//reset dataPointCounter
      migrationMatrix
      migrationMatrix[timeStepCounter] = [];//add a new array row
    }

    migrationMatrix[timeStepCounter][dataPointCounter] = new MigrationDataPoint();

    var data = [];
    data = dataSplit[i].split(" ");

    migrationMatrix[timeStepCounter][dataPointCounter].source_id = data[0];
    migrationMatrix[timeStepCounter][dataPointCounter].target_id = data[1];
    migrationMatrix[timeStepCounter][dataPointCounter].weight = data[2];

    dataPointCounter++;
  }
};

function initData(){
  populateMigrationMatrix();
  // extract country names from nodes
  for(var i = 0; i < nodes.length; i++){
    var splitNodes = nodes[i].split("/");
    nodes[i] = splitNodes[splitNodes.length - 1];
  }

  // move countryData into the countries array 
  var i = 0; 
  for(var c in countryData) {
    var country = new Country(); 
    country.code = c;
    country.fullName = countryData[c].fullName;
    country.coords = countryData[c].coords;
    countries[i] = country;
    i++;
  }

  // set ids for all countries
  for(var c in countries){
    setCountryId(countries[c]); 
  }

  var paths = $("path");
  //save html elements to countries array
  for (var c in countries) { 
    for (var p = 0; p < paths.length; p++) {
      if( $(paths[p]).data().code.toLowerCase() == countries[c].code.toLowerCase()) {
        countries[c].element = paths[p];
        countries[c].element.setAttribute("isSelected", "false");
        break;
      }
    }
  }

  //remove irrelevant countries
  var tempArray = [];
  for(var c in countries){
    if(countries[c].id){
      tempArray.push(countries[c]);
    }
  }
  countries = tempArray;

  //color countries
  for (var c in countries) {
    // $(countries[c].element).attr("fill", "gray");
  }

  //assign each country its own migrationMatrix 
  for(var c in countries) {
    var currentCountry = countries[c];
    //outgoing population data
    currentCountry.countryEmigrationData = [];
    //incoming population data
    currentCountry.countryImmigrationData = [];

    //total incoming population per timeStep
    currentCountry.totalIn = [];
    //total outgoing population per timeStep
    currentCountry.totalOut = [];
    //total migrating population (in + out) per timeStep
    currentCountry.totalPop = [];

    for(var timeStep in migrationMatrix){
      if(!currentCountry.countryEmigrationData[timeStep]){
        //add a new array row for the current timeStep
        currentCountry.countryEmigrationData[timeStep] = []; 
        currentCountry.countryImmigrationData[timeStep] = [];
        currentCountry.totalIn[timeStep] = 0;
        currentCountry.totalOut[timeStep] = 0;
        currentCountry.totalPop[timeStep] = 0
      }
      
      //outgoing pop data entry counter
      var currentDataPoint = 0;
      //incoming pop data entry counter
      var currentDataPointIn = 0;

      for(var dataPoint in migrationMatrix[timeStep]){
        var currentMigrationDataPoint = migrationMatrix[timeStep][dataPoint];
        //outgoing population (the source is the currentCountry)
        if(currentMigrationDataPoint.source_id == currentCountry.id){
          currentCountry.countryEmigrationData[timeStep][currentDataPoint] = currentMigrationDataPoint;
          currentDataPoint++;
          currentCountry.totalOut[timeStep] += Number(currentMigrationDataPoint.weight);
        }
        //incoming population (the target is the currentCountry)
        if(currentMigrationDataPoint.target_id == currentCountry.id){
          currentCountry.countryImmigrationData[timeStep][currentDataPointIn] = currentMigrationDataPoint;
          currentDataPointIn++;
          currentCountry.totalIn[timeStep] += Number(currentMigrationDataPoint.weight);
        }

      }//end dataPoint iteration

      //total migrating population (in + out)
      currentCountry.totalPop[timeStep] = Number(currentCountry.totalOut[timeStep]) + Number(currentCountry.totalIn[timeStep]);

    }//end timeStep iteration
  }//end country iteration

  //set country id to be equal to its position in our countries array
  var tempArray = [];
  for (var c in countries) {
    tempArray[countries[c].id] = countries[c];
  }
  countries = tempArray;

  //add the theMap id to our svg element
  $("svg")[0].id = "theSVG";//the svg canvas
  $("g")[0].id = "theMap";//the map canvas in the svg (is actually a <g> element...)
  
  //get the SVG
  theSVG = d3.select("#theSVG");
  //assign the map to a variable
  theMap = d3.select("#theMap");
  //assign tooltip
  tooltipDiv = $("#theTooltip")[0];

    // $(p).data()
  // Object {code: "FR"}
  // $(p).data().code
  // "FR"
  /*
  $(p).attr("fill")
  "white"
  $(p).attr("fill", "blue")
  */
    

};//endof initData()

///
///-----------
///
/// Helpers & Utils
///
///-----------
///

function getCountryByCode(countryCode) {
  for(var c in countries){
    if(countries[c].code.toLowerCase() == countryCode.toLowerCase()) return countries[c];
  }
  return null;
};

function getCountryCenter(countryId){
  var point = Object();
  point.x = 0;
  point.y = 0;

  var country = countries[countryId];
  if(!country) return null;//non-existant map element
  if(!country.element) return null;//non-existant map element
  var e = country.element;
  var boundRect = e.getBBox();

  point.x = (2*boundRect.x + boundRect.width) / 2;
  point.y = (2*boundRect.y + boundRect.height) / 2;

  return point; 
};

function toRad(degrees) {
  return degrees * Math.PI / 180;
};

function setCountryId(country) {  
  for(var nodeId in nodes){ 
    if(country.fullName == nodes[nodeId]) country.id = nodeId; 
  }
};

///
///-----------
///
/// Event Listeners
///
///-----------
///

function moveMap(direction){
  var transformString = theMap.attr("transform");
  var translateString = transformString.substring(transformString.lastIndexOf("("));
  var translateValue = Number(translateString.substring(translateString.lastIndexOf(",")+1, translateString.length-1));
  if(direction == "up"){
    translateValue += 10;
  } else if(direction == "down") {
    translateValue -= 10;
  }
  console.log(translateValue);
  var newTransformString = transformString.substring(0, transformString.lastIndexOf(",") + 1);
  newTransformString += " ";
  newTransformString += translateValue;
  newTransformString += ")";
  theMap.attr("transform", newTransformString);
}

function addClickListeners(){
  //+ - zoom function
  var body = $("body")[0];
  body.onkeydown = function(key) { 
    if(key.keyCode == 189 || key.keyCode == 107) {//key = or +(numpad)
      $(".jvectormap-zoomout")[0].click();
    } else if (key.keyCode == 187 || key.keyCode == 109) {//key - or -(numpad)
      $(".jvectormap-zoomin")[0].click();
    } else if (key.keyCode == 38) {//up arrow
      moveMap("up");
    } else if (key.keyCode == 40) {//down arrow
      moveMap("down");
    } else if (key.keyCode == 37) {//left arrow
    } else if (key.keyCode == 39) {//right arrow
    }
  }

  $("svg").on("click", function(event) {
    if(event.which == 2){
      //drag event with middle click, do nothing special
      return;
    }
    if(event.target.tagName == "path"){
      if(event.ctrlKey == true || event.shiftKey == true){
        drawCountryLines(event.target);
        event.target.setAttribute("selected", "true");
        selectedCountryElements.push(event.target);
      } else {
        clearLines();
        drawCountryLines(event.target);
        event.target.setAttribute("selected", "true");
        selectedCountryElements.push(event.target);
      }
    } else if (event.target.tagName == "svg") {
      clearLines();
      clearSelected();
    }
  });

};

///
///-----------
///
/// Drawing
///
///-----------
///

var lineFunction = d3.svg.line()
                            .x(function(d) { return d.x; })
                            .y(function(d) { return d.y; })
                            .interpolate("linear");

function drawAll(){
  clearLines();
  for(var c in countries){
    var e = countries[c].element;
    $(e).click();
  }
  reDrawSelectedCountryLines();
}

function drawPieCharts() {
  //custom values
  var minInnerRadius = 2;
  var minOuterRadius = 7;

  for (var c in countries) {
    center = getCountryCenter(c);
    if(center == null) continue;

    //draw the pie chart in the center of our country
    var translationPoint = "translate(" + center.x + "," + center.y + ")";

    var totalPop = countries[c].totalPop[currentTimeStep];
    var inPop = countries[c].totalIn[currentTimeStep];
    var outPop = countries[c].totalOut[currentTimeStep];

    //using a custom pie chart ratio scale: from 0 to totalMigrationPopulation
    var popScale = d3.scale.linear().domain([0, totalPop]).range([0, 2 * Math.PI]);

    var innerRadius = ((totalPop / maxMigrationValue) * 20) / 2;
    if(innerRadius < minInnerRadius) innerRadius = minInnerRadius;//make sure innerRadius is not too small

    var outerRadius = (totalPop / maxMigrationValue) * 20;
    if(outerRadius < minOuterRadius) outerRadius = minOuterRadius;//make sure outerRadius is not too small

    var inArc = d3.svg.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(popScale(0))
      .endAngle(popScale(inPop));

    var outArc = d3.svg.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(popScale(inPop))
      .endAngle(popScale(totalPop));

    var inPieChart = theMap.append("path")
      .attr("d", inArc)
      .attr("fill", "#4DCB6D")
      .attr("transform", translationPoint)
      .on("mouseover", tooltipMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout)
      .attr("type", "chart")
      .attr("tooltip", "Immigration to " + countries[c].fullName + " : " + inPop );

    var outPieChart = theMap.append("path")
      .attr("d", outArc)
      .attr("fill", "red")
      .attr("transform", translationPoint)
      .on("mouseover", tooltipMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout)
      .attr("type", "chart")
      .attr("tooltip", "Emigration from " + countries[c].fullName + " : " + outPop );


    allPieCharts.push(inPieChart);
    allPieCharts.push(outPieChart);
  }

};

function tooltipMouseover() {
  $(tooltipDiv).css("display", "inline");
  $(this).css("opacity", "0.5");
}

function tooltipMousemove() {
  tooltipDiv.innerHTML = $(this).attr("tooltip");
  $(tooltipDiv).attr("style", "left : " + d3.event.pageX +"px; top: " + d3.event.pageY + "px;");
}

function tooltipMouseout() {
  $(tooltipDiv).css("display", "none");
  if($(this).attr("type") == "chart"){
    $(this).css("opacity", "1");
  }
  else{
    $(this).css("opacity", "0.2");
  }
}

function drawCountryLines(countryElement){
  var country = getCountryByCode($(countryElement).data().code);
  if(!country) return;//check if country exists on the map

  var emigrationData = country.countryEmigrationData;
  var immigrationData = country.countryImmigrationData;

  var center = getCountryCenter(country.id);
  if(center == null) return;


  if(showEmigration)
  //draw emigration lines
  for(var dataPointIndex in emigrationData[currentTimeStep]){
    var dataPoint = emigrationData[currentTimeStep][dataPointIndex];
    if (!countries[dataPoint.target_id]) continue; //check if target country exists on the map
    var targetCenter = getCountryCenter(dataPoint.target_id);
    if (targetCenter == null) continue;

    var lineData = [ 
    { "x": center.x, "y": center.y},  
    { "x": targetCenter.x, "y": targetCenter.y}
    ];

    var lineWidth = (dataPoint.weight / totalMigration) * 1000;
    if(useMinimumLineWidth) {
      if(lineWidth < minLineWidth) lineWidth = minLineWidth;
    }

    var lineGraph = theMap.append("path")
      .attr("d", lineFunction(lineData))
      .attr("stroke", "red")
      .attr("stroke-width", lineWidth)
      .attr("fill", "none")
      .style("opacity", 0.2)
      .on("mouseover", tooltipMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout)
      .attr("tooltip", "Emigration from " + country.fullName + " to " + countries[dataPoint.target_id].fullName + ": " + dataPoint.weight);

    allLines.push(lineGraph[0][0]);
  }

  if(showImmigration)
  //draw immigration lines
  for(var dataPointIndex in immigrationData[currentTimeStep]){
    var dataPoint = immigrationData[currentTimeStep][dataPointIndex];
    if (!countries[dataPoint.target_id]) continue; //check if target country exists on the map
    var targetCenter = getCountryCenter(dataPoint.source_id);
    if (targetCenter == null) continue;

    var lineData = [ 
    { "x": center.x, "y": center.y},  
    { "x": targetCenter.x, "y": targetCenter.y}
    ];

    var lineWidth = (dataPoint.weight / totalMigration) * 1000;
    if(useMinimumLineWidth) {
      if(lineWidth < minLineWidth) lineWidth = minLineWidth;
    }

    var lineGraph = theMap.append("path")
      .attr("d", lineFunction(lineData))
      .attr("stroke", "#4DCB6D")
      .attr("stroke-width", lineWidth)
      .attr("fill", "none")
      .style("opacity", 0.2)
      .on("mouseover", tooltipMouseover)
      .on("mousemove", tooltipMousemove)
      .on("mouseout", tooltipMouseout)
      .attr("tooltip", "Immigration from " + countries[dataPoint.source_id].fullName + " to " + country.fullName + ": " + dataPoint.weight);

    allLines.push(lineGraph[0][0]);
  }

};
