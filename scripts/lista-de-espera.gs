const HEADERS = [
  'Data',
  'Nome',
  'E-mail',
  'Telefone',
  'País',
  'Tamanho',
  'Pintura',
  'Forma',
  'Equipamento',
  'PDV',
  'Tomadas',
  'Preço estimado (US$)',
];

function spreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID');
  if (!id) {
    const created = SpreadsheetApp.create('Nordic Tape — lista de espera');
    id = created.getId();
    props.setProperty('SHEET_ID', id);
    const sheet = created.getSheets()[0];
    sheet.setName('Lista');
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return SpreadsheetApp.openById(id);
}

function doGet() {
  const ss = spreadsheet_();
  return ContentService.createTextOutput(ss.getUrl());
}

function doPost(e) {
  const sheet = spreadsheet_().getSheetByName('Lista');
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.phone || '',
    data.country || '',
    data.size || '',
    data.paint || '',
    data.shape || '',
    data.equipment || '',
    data.pdv || '',
    data.sockets || '',
    data.estimatedTotal || '',
  ]);
  return ContentService.createTextOutput('ok');
}
