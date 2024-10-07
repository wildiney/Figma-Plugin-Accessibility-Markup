let initialNumber = "1";

figma.showUI(__html__, { width: 300, height: 400, themeColors: true });

figma.ui.onmessage = async (msg) => {

  switch (msg.type) {
    case 'change-number':
      handleNumberChange(msg.value);
      break;
    case 'insert-markup-frame':
      await handleInsertMarkupFrame(msg);
      break;
  }
};

function handleNumberChange (value: number | undefined) {
  if (value != null) {
    initialNumber = value.toString();
  }
}

async function handleInsertMarkupFrame (msg: { marker: string; spacing: number }) {
  await figma.loadFontAsync({
    family: 'Inter',
    style: 'Regular',
  });
  const selectedFrame = figma.currentPage.selection[0];

  if (!selectedFrame) {
    figma.notify("Nenhum frame ou instância selecionada");
    return;
  }

  if (selectedFrame && ["FRAME", "INSTANCE", "TEXT"].includes(selectedFrame.type)) {
    const frame = createFrame(selectedFrame, msg)
    figma.currentPage.appendChild(frame);

    initialNumber = incrementNumber(initialNumber)

    figma.notify("Instância criada com sucesso");
  } else {
    figma.notify("Select a frame, instance or text");
  }
}

function createFrame (selectedFrame: FrameNode | SceneNode, msg: { marker: string; spacing: number }) {
  let xAdjust = 0;
  let yAdjust = 0;
  let xLabel = 0
  let yLabel = 0
  let shouldResizeWidth = true;
  let shouldResizeHeight = true;

  switch (msg.marker) {
    case "top_left":
      xAdjust = -msg.spacing;
      yAdjust = -msg.spacing;
      xLabel = -msg.spacing / 2;
      yLabel = -msg.spacing / 2;
      break;
    case "top_center":
      yAdjust = -msg.spacing;
      xLabel = (selectedFrame.width / 2) + (-msg.spacing / 2)
      yLabel = -msg.spacing / 2;
      shouldResizeWidth = false;
      break;
    case "top_right":
      yAdjust = -msg.spacing;
      xLabel = selectedFrame.width + msg.spacing / 2
      yLabel = -msg.spacing / 2;
      break;
    case "middle_left":
      xAdjust = -msg.spacing;
      xLabel = -msg.spacing / 2;
      yLabel = (selectedFrame.height / 2) + (-msg.spacing / 2)
      shouldResizeHeight = false; // Não ajusta a altura
      break;
    case "middle_right":
      xLabel = selectedFrame.width + (msg.spacing / 2)
      yLabel = (selectedFrame.height / 2) + (-msg.spacing / 2)
      shouldResizeHeight = false; // Não ajusta a altura
      break;
    case "bottom_left":
      xAdjust = -msg.spacing;
      xLabel = -msg.spacing / 2;
      yLabel = selectedFrame.height + (msg.spacing / 2)
      break;
    case "bottom_center":
      xLabel = (selectedFrame.width / 2) + (-msg.spacing / 2)
      yLabel = selectedFrame.height + (msg.spacing / 2)
      shouldResizeWidth = false; // Não ajusta a largura
      break;
    case "bottom_right":
      xLabel = selectedFrame.width + (msg.spacing / 2)
      yLabel = selectedFrame.height + (msg.spacing / 2)
      break;
  }

  const frame = figma.createFrame()
  frame.name = `specs-marker`
  frame.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 }]
  frame.strokes = [{ type: 'SOLID', color: figma.util.rgb(`#005CA9`) }]
  frame.x = selectedFrame.absoluteTransform[0][2] + xAdjust;
  frame.y = selectedFrame.absoluteTransform[1][2] + yAdjust;
  frame.clipsContent = false
  const newWidth = shouldResizeWidth ? selectedFrame.width + msg.spacing : selectedFrame.width;
  const newHeight = shouldResizeHeight ? selectedFrame.height + msg.spacing : selectedFrame.height;
  frame.resize(newWidth, newHeight)

  const label = createLabel()
  frame.appendChild(label)

  label.x = xLabel
  label.y = yLabel

  return frame
}

function createLabel () {
  const valueComponent = figma.createFrame()
  valueComponent.fills = [{ type: 'SOLID', color: figma.util.rgb(`#005CA9`) }]
  valueComponent.cornerRadius = 500
  valueComponent.layoutMode = "HORIZONTAL"
  valueComponent.primaryAxisAlignItems = "CENTER"
  valueComponent.counterAxisAlignItems = `CENTER`
  valueComponent.resize(24, 24)

  const textNode = figma.createText()
  textNode.characters = initialNumber;
  textNode.fills = [{ type: 'SOLID', color: figma.util.rgb(`#FFFFFF`) }]

  valueComponent.appendChild(textNode)
  return valueComponent
}

function incrementNumber (number: string): string {
  if (number.indexOf(".") === -1) {
    return (parseFloat(number) + 1).toString();
  } else {
    const splitedNumber = number.split(".");
    const lastItem = parseInt(splitedNumber[splitedNumber.length - 1]) + 1;
    splitedNumber[splitedNumber.length - 1] = lastItem.toString();
    return splitedNumber.join(".");
  }
}

