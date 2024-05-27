// - convert \ to \\
// - convert {{ to \{{
// - convert " to \"
const convertEscapes = (line: string): string =>
  line.replace(/\\/g, '\\\\').replace(/{{/g, '\\{{').replace(/"/g, '\\"');

// convert <VAR> variables to {{var}} variables
const convertVariables = (line: string, isStartSequence = false): string =>
  line
    .replace(/<X>/g, '{{currentX}}')
    .replace(/<Y>/g, '{{currentY}}')
    .replace(/<Z>/g, '{{currentZ}}')
    .replace(/<NEXTX>/g, '{{nextX}}')
    .replace(/<NEXTY>/g, '{{nextY}}')
    .replace(/<E>/g, '0')
    .replace(/<DESTRING>/g, '{{retractDistance}}')
    .replace(/<TEMP>/g, isStartSequence ? '{{firstLayerPrintTemperature}}' : '{{currentPrintTemperature}}')
    .replace(/<BED>/g, isStartSequence ? '{{bedTemperature}}' : '{{currentBedTemperature}}')
    .replace(/<BOX>/g, '{{chamberTemperature}}')
    .replace(/<LAYER>/g, '{{layer}}')
    .replace(/<TELAPSED>/g, '{{timeElapsed}}')
    .replace(/<TREMAIN>/g, '{{totalTime - timeElapsed}}')
    .replace(/<TTOTAL>/g, '{{totalTime}}');

const directive = `@printerscript 1.0\n`;

export const convertToPrinterScript = (sequence: string, isStartSequence = false): string => {
  const trimmed = sequence.trim();
  if (trimmed.length === 0) {
    return directive;
  }
  const converted = trimmed
    .replace(/\r\n|\r|\n/g, '\n')
    .split('\n')
    .map((line) => {
      const escaped = convertEscapes(line);
      const converted = convertVariables(escaped, isStartSequence);
      return `"${converted}"`;
    })
    .join('\n');
  return `${directive}${converted}`;
};

export const applyStartSequenceDefaults = (
  sequence: string,
  primaryExtruder: number,
  chamberTemp: number
): string => {
  const hasPrintTemp =
    sequence.includes('{{printTemperature}}') || sequence.includes('{{firstLayerPrintTemperature}}');
  const hasBedTemp = sequence.includes('{{bedTemperature}}');
  const hasChamberTemp = sequence.includes('{{chamberTemperature}}');
  const chamberTempUsed = chamberTemp > 0;
  const addPrintTemp = !hasPrintTemp;
  const addBedTemp = !hasBedTemp;
  const addChamberTemp = !hasChamberTemp && chamberTempUsed;

  const printTempCommand = `"M104 S{{firstLayerPrintTemperature}} T${primaryExtruder}"`;
  const bedTempCommand = '"M140 S{{bedTemperature}}"';
  const chamberTempCommand = '"M191 S{{chamberTemperature}}"'; // use just 'stabilize' command
  const stabilizePrintTempCommand = `"M109 S{{firstLayerPrintTemperature}} T${primaryExtruder}"`;
  const stabilizeBedTempCommand = '"M190 S{{bedTemperature}}"';
  const startSequenceParts = [];
  if (addPrintTemp && addBedTemp) {
    startSequenceParts.push(printTempCommand);
    startSequenceParts.push(bedTempCommand);
    startSequenceParts.push(stabilizePrintTempCommand);
    startSequenceParts.push(stabilizeBedTempCommand);
  } else if (addPrintTemp) {
    startSequenceParts.push(printTempCommand);
    startSequenceParts.push(stabilizePrintTempCommand);
  } else if (addBedTemp) {
    startSequenceParts.push(bedTempCommand);
    startSequenceParts.push(stabilizeBedTempCommand);
  }
  const startSequenceLines = sequence.split(/\r|\n|\r\n/g);
  const directive = startSequenceLines.shift(); // remove "@printerscript 1.0" for later
  startSequenceParts.push(...startSequenceLines);
  startSequenceParts.push('";START_OF_PRINT"');
  // make sure chamber heating is the first thing we do
  if (addChamberTemp) {
    startSequenceParts.unshift(chamberTempCommand);
  }
  startSequenceParts.unshift(directive); // restore "@printerscript 1.0" as first line
  return startSequenceParts.join('\n');
};
