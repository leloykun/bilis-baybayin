function create_canvas(width, height) {
  var canv = document.createElement('canvas', '');
  canv.setAttribute('width', width);
  canv.setAttribute('height', height);
  if(typeof G_vmlCanvasManager != 'undefined')
   canv = G_vmlCanvasManager.initElement(canv);
  return canv;
}

function clear_canvas(canv) {
  var context = canv.getContext("2d");
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function draw_on_canvas(canv, drawing, t_lim, to_scale) {
  if (to_scale) {
    var canv_width = canv.clientHeight;
    var canv_height = canv.clientWidth;
    drawing = scale_drawing(drawing, canv_width, canv_height);
  }

  clear_canvas(canv);

  var context = canv.getContext("2d");

  context.strokeStyle = "black";
  context.lineJoin = "round";
  context.lineWidth = 1;

  for (var i = 0; i < drawing.length; ++i) {
    for (var j = 0; j < drawing[i].length; ++j) {
      if (drawing[i][j].t > t_lim)
        break;
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

function scale_drawing(drawing, width, height) {
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

  var scale = Math.min(width, height) / Math.max(maxx - minx, maxy - miny);

  for (var i = 0; i < drawing.length; ++i) {
    for (var j = 0; j < drawing[i].length; ++j) {
      drawing[i][j].x = Math.round((drawing[i][j].x - minx) * scale);
      drawing[i][j].y = Math.round((drawing[i][j].y - miny) * scale);
    }
    drawing[i] = simplify(drawing[i], 2, true);
  }
  return drawing;
}
