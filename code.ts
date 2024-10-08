let initialNumber = '1'

figma.showUI(__html__, { width: 300, height: 400, themeColors: true })

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'change-number':
      handleNumberChange(msg.value)
      break
    case 'insert-markup-frame':
      await handleInsertMarkupFrame(msg)
      break
  }
}

function handleNumberChange (value: number | undefined) {
  if (value != null) {
    initialNumber = value.toString()
  }
}

async function handleInsertMarkupFrame (msg: {
  marker:
  | 'top_left'
  | 'top_center'
  | 'top_right'
  | 'middle_left'
  | 'middle_right'
  | 'bottom_left'
  | 'bottom_center'
  | 'bottom_right'
  spacing: number
}) {
  const selectedFrame = figma.currentPage.selection[0] as SceneNode | FrameNode

  if (!selectedFrame) {
    figma.notify('Nenhum frame ou instância selecionada')
    return
  }
  await figma.loadFontAsync({
    family: 'Inter',
    style: 'Regular',
  })

  if (
    selectedFrame &&
    ['FRAME', 'INSTANCE', 'TEXT'].includes(selectedFrame.type)
  ) {
    const frame = await createFrame(selectedFrame, msg)
    figma.currentPage.appendChild(frame)

    initialNumber = incrementNumber(initialNumber)
    figma.ui.postMessage({
      type: `change-number`,
      newValue: initialNumber.toString(),
    })

    figma.notify('Instância criada com sucesso')
  } else {
    figma.notify('Select a frame, instance or text')
  }
}

async function createFrame (
  selectedFrame: FrameNode | SceneNode,
  msg: {
    marker:
    | 'top_left'
    | 'top_center'
    | 'top_right'
    | 'middle_left'
    | 'middle_right'
    | 'bottom_left'
    | 'bottom_center'
    | 'bottom_right'
    spacing: number
  }
) {
  const label = await createLabel()
  const labelSize = label.width

  const adjustments = {
    top_left: {
      xAdjust: -msg.spacing,
      yAdjust: -msg.spacing,
      xLabel: -labelSize / 2,
      yLabel: -msg.spacing / 2,
      shouldResizeWidth: true,
      shouldResizeHeight: true,
    },
    top_center: {
      xAdjust: 0,
      yAdjust: -msg.spacing,
      xLabel: selectedFrame.width / 2 - labelSize / 2,
      yLabel: -msg.spacing / 2,
      shouldResizeWidth: false,
      shouldResizeHeight: true,
    },
    top_right: {
      xAdjust: 0,
      yAdjust: -msg.spacing,
      xLabel: selectedFrame.width + msg.spacing - labelSize / 2,
      yLabel: -msg.spacing / 2,
      shouldResizeWidth: true,
      shouldResizeHeight: true,
    },
    middle_left: {
      xAdjust: -msg.spacing,
      yAdjust: 0,
      xLabel: -labelSize / 2,
      yLabel: selectedFrame.height / 2 - msg.spacing / 2,
      shouldResizeWidth: true,
      shouldResizeHeight: false,
    },
    middle_right: {
      xAdjust: 0,
      yAdjust: 0,
      xLabel: selectedFrame.width + msg.spacing - labelSize / 2,
      yLabel: selectedFrame.height / 2 - msg.spacing / 2,
      shouldResizeWidth: true,
      shouldResizeHeight: false,
    },
    bottom_left: {
      xAdjust: -msg.spacing,
      yAdjust: 0,
      xLabel: -labelSize / 2,
      yLabel: selectedFrame.height + msg.spacing / 2,
      shouldResizeWidth: true,
      shouldResizeHeight: true,
    },
    bottom_center: {
      xAdjust: 0,
      yAdjust: 0,
      xLabel: selectedFrame.width / 2 - labelSize / 2,
      yLabel: selectedFrame.height + msg.spacing / 2,
      shouldResizeWidth: false,
      shouldResizeHeight: true,
    },
    bottom_right: {
      xAdjust: 0,
      yAdjust: 0,
      xLabel: selectedFrame.width + msg.spacing - labelSize / 2,
      yLabel: selectedFrame.height + msg.spacing / 2,
      shouldResizeWidth: true,
      shouldResizeHeight: true,
    },
  }

  const adj = adjustments[msg.marker] || {
    xAdjust: 0,
    yAdjust: 0,
    xLabel: 0,
    yLabel: 0,
    shouldResizeWidth: true,
    shouldResizeHeight: true,
  }

  const frame = figma.createFrame()
  frame.name = `specs-marker`
  frame.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 }]
  frame.strokes = [{ type: 'SOLID', color: figma.util.rgb(`#005CA9`) }]
  frame.x = selectedFrame.absoluteTransform[0][2] + adj.xAdjust
  frame.y = selectedFrame.absoluteTransform[1][2] + adj.yAdjust
  frame.clipsContent = false
  if (adj.shouldResizeWidth || adj.shouldResizeHeight) {
    const newWidth = adj.shouldResizeWidth
      ? selectedFrame.width + msg.spacing
      : selectedFrame.width
    const newHeight = adj.shouldResizeHeight
      ? selectedFrame.height + msg.spacing
      : selectedFrame.height
    frame.resize(newWidth, newHeight)
  }
  frame.appendChild(label)

  label.x = adj.xLabel
  label.y = adj.yLabel

  return frame
}

async function createLabel () {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })

  const textNode = figma.createText()
  textNode.characters = initialNumber
  textNode.fills = [{ type: 'SOLID', color: figma.util.rgb(`#FFFFFF`) }]

  const valueComponent = figma.createFrame()
  valueComponent.fills = [{ type: 'SOLID', color: figma.util.rgb(`#005CA9`) }]
  valueComponent.cornerRadius = 500
  valueComponent.layoutMode = 'HORIZONTAL'
  valueComponent.primaryAxisAlignItems = 'CENTER'
  valueComponent.counterAxisAlignItems = `CENTER`
  valueComponent.paddingBottom = 4
  valueComponent.paddingLeft = 4
  valueComponent.paddingRight = 4
  valueComponent.paddingTop = 4
  valueComponent.resize(Math.max(textNode.width + 8, 24), 24)
  valueComponent.appendChild(textNode)
  return valueComponent
}

function incrementNumber (number: string): string {
  if (number.indexOf('.') === -1) {
    return (parseFloat(number) + 1).toString()
  } else {
    const splitedNumber = number.split('.')
    if (isNaN(parseInt(splitedNumber[splitedNumber.length - 1]))) {
      return number
    }
    const lastItem = parseInt(splitedNumber[splitedNumber.length - 1]) + 1
    splitedNumber[splitedNumber.length - 1] = lastItem.toString()
    return splitedNumber.join('.')
  }
}
