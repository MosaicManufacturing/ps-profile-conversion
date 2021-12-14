
const convertToPrinterScript = (sequence, isStartSequence = false) => {
  // trim whitespace and normalize newlines
  const trimmed = sequence.trim().replace(/\r\n|\r|\n/g, '\n');
  // convert <VAR> variables to {{var}} variables
  const replaced = trimmed
    .replace(/<X>/g, '{{currentX}}')
    .replace(/<Y>/g, '{{currentY}}')
    .replace(/<Z>/g, '{{currentZ}}')
    .replace(/<NEXTX>/g, '{{nextX}}')
    .replace(/<NEXTY>/g, '{{nextY}}')
    .replace(/<E>/g, '0')
    .replace(/<DESTRING>/g, '{{retractDistance}}')
    .replace(/<TEMP>/g, isStartSequence ? '{{firstLayerPrintTemperature}}' : '{{currentPrintTemperature}}')
    .replace(/<BED>/g, isStartSequence ? '{{bedTemperature}}' : '{{currentBedTemperature}}')
    .replace(/<LAYER>/g, '{{layer}}')
    .replace(/<TELAPSED>/g, '{{timeElapsed}}')
    .replace(/<TREMAIN>/g, '{{totalTime - timeElapsed}}')
    .replace(/<TTOTAL>/g, '{{totalTime}}');
  // enclose each line in quotes
  const escaped = replaced.split('\n')
    .map(line => `"${line.replace(/"/g, '\\"')}"`)
    .join('\n');
  // add directive
  return `@printerscript 1.0\n${escaped}`;
};

const applyStartSequenceDefaults = (sequence, machine, primaryExtruder, bedTemp) => {
  const hasPrintTemp = sequence.includes('{{printTemperature}}')
    || sequence.includes('{{firstLayerPrintTemperature}}');
  const hasBedTemp = sequence.includes('{{bedTemperature}}');
  const bedTempUsed = bedTemp > 0;
  const addPrintTemp = !hasPrintTemp;
  const addBedTemp = (!hasBedTemp && bedTempUsed);

  const printTempCommand = `"M104 S{{firstLayerPrintTemperature}} T${primaryExtruder}"`;
  const bedTempCommand = '"M140 S{{bedTemperature}}"';
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
  startSequenceParts.unshift(directive); // restore "@printerscript 1.0" as first line
  return startSequenceParts.join('\n');
};

module.exports = {
  convertToPrinterScript,
  applyStartSequenceDefaults,
};
