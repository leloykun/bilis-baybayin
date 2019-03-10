var canvasWidth = 256;
var canvasHeight = 256;
var drawing = new Array();
var paint;
var d = null;
var start_time;

var canvasDiv = document.getElementById('canvasDiv');
var canvas = document.getElementById('canvas');
if(typeof G_vmlCanvasManager != 'undefined') {
 canvas = G_vmlCanvasManager.initElement(canvas);
}
context = canvas.getContext("2d");

function reset_canvas_size() {
  canvas.setAttribute('width', $(canvasDiv).width()-10);
  canvas.setAttribute('height', $(canvasDiv).height()-10);
  redraw();
}
reset_canvas_size();
window.addEventListener("resize", reset_canvas_size);

var getURLParams = function (name) {
  var params = {};
  location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) {
      params[key] = value;
  });

  return params[name] || params;
};

var params = getURLParams();
console.log(params);
if (params.id) {
  console.log(params.id);
  show_drawing(params.id);
}

var test_ref = firebase.database().ref('drawings');
test_ref.on('value', got_data, err_data);

function press(e) {
  var mouseX = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) - this.offsetLeft;
  var mouseY = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) - this.offsetTop;

  d = new Date();
  if (drawing.length == 0)
    start_time = d.getTime();
  time = d.getTime() - start_time;;

  paint = true;
  addClick(mouseX, mouseY, time, true);
  redraw();
}

function drag(e) {
  if(paint){
    var mouseX = (e.changedTouches ? e.changedTouches[0].pageX : e.pageX) - this.offsetLeft;
    var mouseY = (e.changedTouches ? e.changedTouches[0].pageY : e.pageY) - this.offsetTop;

    d = new Date();
    time = d.getTime() - start_time;

    addClick(mouseX, mouseY, time, false);
    redraw();
  }

  // Prevent the whole page from dragging if on mobile
  e.preventDefault();
}

function release() {
  paint = false;
  redraw();
}

function cancel() {
  paint = false;
};

// Add mouse event listeners to canvas element
canvas.addEventListener("mousedown", press, false);
canvas.addEventListener("mousemove", drag, false);
canvas.addEventListener("mouseup", release);
canvas.addEventListener("mouseout", cancel, false);

// Add touch event listeners to canvas element
canvas.addEventListener("touchstart", press, false);
canvas.addEventListener("touchmove", drag, false);
canvas.addEventListener("touchend", release, false);
canvas.addEventListener("touchcancel", cancel, false);

function addClick(x, y, time, is_new_stroke) {
  if (is_new_stroke)
    drawing.push(new Array());
  drawing[drawing.length-1].push({
    x: x,
    y: y,
    t: time
  });
}

function redraw() {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas

  context.strokeStyle = "black";
  context.lineJoin = "round";
  context.lineWidth = 1;

  for (var i = 0; i < drawing.length; ++i) {
    for (var j = 0; j < drawing[i].length; ++j) {
      context.beginPath();
      if (j > 0)
        context.moveTo(drawing[i][j-1].x, drawing[i][j-1].y);
      else
        context.moveTo(drawing[i][j].x-1, drawing[i][j].y);
      context.lineTo(drawing[i][j].x, drawing[i][j].y);
      context.closePath();
      context.stroke();
    }
  }
}

function clear_canvas() {
  drawing = new Array();
  redraw();
}

function dist_to_line(p, l1, l2) {
  var u = Math.abs((l2.y - l1.y)*p.x - (l2.x - l1.x)*p.y + l2.x*l1.y - l2.y*l1.x);
  var v = Math.sqrt(Math.pow(l2.y - l1.y, 2) + Math.pow(l2.x - l1.x, 2));
  return u/v;
}

function rescale_drawing() {
  var minx = Number.POSITIVE_INFINITY;
  var miny = Number.POSITIVE_INFINITY;

  var maxx = Number.NEGATIVE_INFINITY;
  var maxy = Number.NEGATIVE_INFINITY;

  for (var i = 0; i < drawing.length; ++i) {
    for (var j = 0; j < drawing[i].length; ++j) {
      minx = Math.min(minx, drawing[i][j].x);
      miny = Math.min(miny, drawing[i][j].y);

      maxx = Math.max(maxx, drawing[i][j].x);
      maxy = Math.max(maxy, drawing[i][j].y);
    }
  }

  var scale = Math.max(maxx - minx, maxy - miny);

  for (var i = 0; i < drawing.length; ++i) {
    for (var j = 0; j < drawing[i].length; ++j) {
      drawing[i][j].x = Math.round((drawing[i][j].x - minx) * (256 / scale));
      drawing[i][j].y = Math.round((drawing[i][j].y - miny) * (256 / scale));
    }
    console.log({origLen: drawing[i].length});
    drawing[i] = simplify(drawing[i], 2, true);
    console.log({newLen: drawing[i].length});
  }
}

function save_canvas() {
  var ref = database.ref('drawings');
  var data = {
    character: letra,
    drawing: drawing
  }
  var result = ref.push(data, dataSent);
  console.log(result.key);

  function dataSent(err, status) {
    console.log(status);
  }

  clear_canvas();
}

function got_data(data) {
  $('#drawing_list').empty();

  var drawing_list = document.getElementById('drawing_list');
  if (drawing_list == null)
    return;

  var drawings = data.val();
  var keys = Object.keys(drawings);
  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i];

    var li = document.createElement('li', '');
    var perma = document.createElement('a', '');
    perma.setAttribute('href', '?id=' + key);
    perma.innerHTML = key;
    li.appendChild(perma);
    drawing_list.appendChild(li);
  }
}

function err_data(err) {
  console.log(err);
}

function show_drawing(key) {
  var ref = database.ref('drawings/' + key);
  ref.once('value', one_drawing, err_data);

  function one_drawing(data) {
    var dbdrawing = data.val();
    drawing = dbdrawing.drawing;
    rescale_drawing();
    redraw();
  }
}
