(() => {
  const sliderB = document.getElementById("sliderB");
  const sliderC = document.getElementById("sliderC");
  const sliderRider = document.getElementById("sliderRider");
  const valueB = document.getElementById("valueB");
  const valueC = document.getElementById("valueC");
  const valueRider = document.getElementById("valueRider");
  const readout = document.getElementById("volumeReadout");
  const graphEquation = document.getElementById("graphEquation");
  const graphMeta = document.getElementById("graphMeta");
  const equationY1 = document.getElementById("equationY1");
  const equationY2 = document.getElementById("equationY2");
  const equationY3 = document.getElementById("equationY3");
  const equationV = document.getElementById("equationV");
  const equationB = document.getElementById("equationB");
  const equationC = document.getElementById("equationC");
  const equationRider = document.getElementById("equationRider");
  const graphLine = document.getElementById("volumeGraphLine");
  const graphRider = document.getElementById("volumeGraphRider");
  const graphAxisX = document.getElementById("graphAxisX");
  const graphAxisY = document.getElementById("graphAxisY");
  const graphGrid = document.getElementById("graphGrid");
  const graphLabels = document.getElementById("graphLabels");
  const graphClipRect = document.getElementById("graphClipRect");

  const SVG_NS = "http://www.w3.org/2000/svg";
  const graph = {
    width: 520,
    height: 240,
    padLeft: 42,
    padRight: 16,
    padTop: 18,
    padBottom: 32,
    samples: 400,
    xMin: 0,
    xMax: 100,
    yMin: 0,
    yMax: 100,
  };

  function formatNumber(value, digits = 2) {
    return Number.parseFloat(value.toFixed(digits)).toString();
  }

  function createSvgElement(name, attributes) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }

  function setSliderFill(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const value = parseFloat(slider.value);
    const percent = ((value - min) / (max - min)) * 100;

    slider.style.setProperty("--fill-size", `${percent.toFixed(2)}%`);
  }

  // Math lock:
  // The y1, y2, y3, and V definitions below are intentionally finalized.
  // Do not modify the mathematics or synced equation text unless the user explicitly asks for a math change.
  function evaluatePoint(x, a, b, c) {
    const y1 = (((-2 * a) / 100) + 1) * x + a;
    const y2 = b * Math.sin(y1);
    const y3 = x * Math.cos(y2 + c);
    const v = y1 + y2 / ((a / 100) + 1) + y3;

    return { x, y1, y2, y3, v };
  }

  function sampleCurve(a, b, c) {
    const points = [];
    const span = graph.xMax - graph.xMin;

    for (let index = 0; index <= graph.samples; index += 1) {
      const x = graph.xMin + (span * index) / graph.samples;
      points.push(evaluatePoint(x, a, b, c));
    }

    return points;
  }

  function mapX(x) {
    const plotWidth = graph.width - graph.padLeft - graph.padRight;
    return graph.padLeft + ((x - graph.xMin) / (graph.xMax - graph.xMin)) * plotWidth;
  }

  function mapY(y) {
    const plotHeight = graph.height - graph.padTop - graph.padBottom;
    return graph.height - graph.padBottom - ((y - graph.yMin) / (graph.yMax - graph.yMin)) * plotHeight;
  }

  function buildPath(points) {
    return points
      .map((point, index) => {
        const command = index === 0 ? "M" : "L";
        return `${command} ${mapX(point.x).toFixed(2)} ${mapY(point.v).toFixed(2)}`;
      })
      .join(" ");
  }

  function renderGrid() {
    graphGrid.replaceChildren();
    graphLabels.replaceChildren();
    graphClipRect.setAttribute("x", graph.padLeft.toFixed(2));
    graphClipRect.setAttribute("y", graph.padTop.toFixed(2));
    graphClipRect.setAttribute("width", (graph.width - graph.padLeft - graph.padRight).toFixed(2));
    graphClipRect.setAttribute("height", (graph.height - graph.padTop - graph.padBottom).toFixed(2));

    const xTicks = [0, 20, 40, 60, 80, 100];
    xTicks.forEach((tick) => {
      const x = mapX(tick).toFixed(2);
      const y = (graph.height - 10).toFixed(2);

      graphGrid.appendChild(
        createSvgElement("line", {
          class: "graph-grid",
          x1: x,
          y1: graph.padTop.toFixed(2),
          x2: x,
          y2: (graph.height - graph.padBottom).toFixed(2),
        })
      );

      graphLabels.appendChild(
        createSvgElement("text", {
          class: "graph-label",
          x,
          y,
          "text-anchor": "middle",
        })
      ).textContent = formatNumber(tick, 1);
    });

    [0, 20, 40, 60, 80, 100].forEach((tick) => {
      const y = mapY(tick).toFixed(2);

      graphGrid.appendChild(
        createSvgElement("line", {
          class: "graph-grid",
          x1: graph.padLeft.toFixed(2),
          y1: y,
          x2: (graph.width - graph.padRight).toFixed(2),
          y2: y,
        })
      );

      graphLabels.appendChild(
        createSvgElement("text", {
          class: "graph-label",
          x: (graph.padLeft - 8).toFixed(2),
          y: (mapY(tick) + 4).toFixed(2),
          "text-anchor": "end",
        })
      ).textContent = formatNumber(tick, 1);
    });

    const xAxisY = mapY(0).toFixed(2);
    const yAxisX = mapX(0).toFixed(2);

    graphAxisX.setAttribute(
      "d",
      `M ${graph.padLeft.toFixed(2)} ${xAxisY} H ${(graph.width - graph.padRight).toFixed(2)}`
    );
    graphAxisY.setAttribute(
      "d",
      `M ${yAxisX} ${graph.padTop.toFixed(2)} V ${(graph.height - graph.padBottom).toFixed(2)}`
    );
  }

  function renderText(a, b, c, riderPoint) {
    const origin = evaluatePoint(0, a, b, c);
    const aText = formatNumber(a, 1);
    const bText = formatNumber(b, 1);
    const cText = formatNumber(c, 1);
    const y1SlopeText = formatNumber(((-2 * a) / 100) + 1);
    const vAtAText = formatNumber(riderPoint.v);

    valueB.textContent = bText;
    valueC.textContent = cText;
    valueRider.textContent = aText;
    readout.textContent =
      `Only V is graphed. a = ${aText}, B = ${bText}, C = ${cText}, V(a) = ${vAtAText}, V(0) = ${formatNumber(origin.v)}.`;
    graphEquation.innerHTML =
      `V(x) = y<sub>1</sub> + y<sub>2</sub> / ((${aText} / 100) + 1) + x cos(y<sub>2</sub> + ${cText})`;
    graphMeta.textContent = `x range: ${graph.xMin} to ${graph.xMax} | y range: ${graph.yMin} to ${graph.yMax}`;
    equationY1.innerHTML = `y<sub>1</sub> = (${y1SlopeText})x + ${aText}`;
    equationY2.innerHTML = `y<sub>2</sub> = ${bText} sin(y<sub>1</sub> * 1)`;
    equationY3.innerHTML =
      `y<sub>3</sub> = x cos(y<sub>2</sub> + ${cText})`;
    equationV.innerHTML = `V = y<sub>1</sub> + y<sub>2</sub> / ((${aText} / 100) + 1) + y<sub>3</sub>`;
    equationB.textContent = `B range: 0 to 10. Higher B increases the swing inside y2.`;
    equationC.textContent = `C range: -1.6 to 4.7. C shifts the cosine term used inside y3.`;
    equationRider.textContent = `a = ${aText}; it makes y1 = (${y1SlopeText})x + ${aText}, divides y2 by ((${aText} / 100) + 1), and places the dot at x = a where V(a) = ${vAtAText}.`;
  }

  function render() {
    const a = parseFloat(sliderRider.value);
    const b = parseFloat(sliderB.value);
    const c = parseFloat(sliderC.value);
    const points = sampleCurve(a, b, c);
    const riderPoint = evaluatePoint(a, a, b, c);

    setSliderFill(sliderB);
    setSliderFill(sliderC);
    setSliderFill(sliderRider);
    graphLine.setAttribute("d", buildPath(points));
    graphRider.setAttribute("cx", mapX(riderPoint.x).toFixed(2));
    graphRider.setAttribute("cy", mapY(riderPoint.v).toFixed(2));
    renderGrid();
    renderText(a, b, c, riderPoint);

    window.assignmentGraph = {
      evaluatePoint,
      sampleCurve,
      params: { a, b, c },
      riderPoint,
      view: {
        xMin: graph.xMin,
        xMax: graph.xMax,
        yMin: graph.yMin,
        yMax: graph.yMax,
      },
    };
  }

  [sliderB, sliderC, sliderRider].forEach((slider) => {
    slider.addEventListener("input", render);
    slider.addEventListener("change", render);
  });

  render();
})();
