import * as vscode from 'vscode';

const supportedLanguages = vscode.workspace
  .getConfiguration('zede-jetbrains-helper')
  .get('supportedLanguages') as string[];

function isLanguageUsed(id: string): boolean {
  return vscode.window.activeTextEditor?.document.languageId === id 
    && supportedLanguages.includes(id);
}

const denylistTags = vscode.workspace
  .getConfiguration('zede-jetbrains-helper')
  .get('denylistTags') as string[];

const denylistTagsFormattedEndings: string[] = denylistTags.map(tag => '</' + tag + '>');

const denylistTagsFormattedBeginnings: string[] = denylistTags.map(tag => '<' + tag + '>');

const denylistTagsFormattedBeginningsWithWhitespaces: string[] = denylistTags.map(tag => '<' + tag + ' ');

const denylistTagsFormattedBeginningsWithLinebreaks: string[] = denylistTags.map(tag => '<' + tag);

const allowEverywhere = vscode.workspace
  .getConfiguration('zede-jetbrains-helper')
  .get('allowEverywhere') as boolean;

const tagColorList = vscode.workspace
  .getConfiguration('zede-jetbrains-helper')
  .get('colors') as string[];

const colorStyle = vscode.workspace
  .getConfiguration('zede-jetbrains-helper')
  .get('highlightType') as string;

const isolatedRightBracketsDecorationTypes: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType(
  {
    color: '#e2041b'
  }
);

const tagDecoratorList: vscode.TextEditorDecorationType[] = [];

export function activate(context: vscode.ExtensionContext): void {
  const registerExtensionCommand: vscode.Disposable = vscode.commands.registerCommand(
    'extension.rainbowTags',
    () => {
      if (!vscode.window.activeTextEditor) {
        return;
      }
      rainbowTags(vscode.window.activeTextEditor);
    }
  );
  context.subscriptions.push(registerExtensionCommand);

  vscode.workspace.onDidChangeConfiguration(() => {
    const newColors = vscode.workspace
      .getConfiguration('zede-jetbrains-helper')
      .get('colors') as string[];

    if (!(tagColorList.length === newColors.length && tagColorList.every((value, index) => value === newColors[index]))) {
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  });

  for (let colorIndex in tagColorList) {
    let stylePair;

    switch (colorStyle) {
      case 'background-color':
        stylePair = {
          backgroundColor: tagColorList[colorIndex]
        };
        break;

      case 'border':
        stylePair = {
          border: '1px solid ' + tagColorList[colorIndex]
        };
        break;

      default:
        stylePair = {
          color: tagColorList[colorIndex]
        };
        break;
    }

    tagDecoratorList.push(
      vscode.window.createTextEditorDecorationType(stylePair)
    );
  }

  if (vscode.window.activeTextEditor) {
    rainbowTags(vscode.window.activeTextEditor);
  }

  vscode.workspace.onDidOpenTextDocument(
    editor => {
      rainbowTags(editor as unknown as vscode.TextEditor);
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      rainbowTags(editor as unknown as vscode.TextEditor);
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      rainbowTags(editor as unknown as vscode.TextEditor);
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    function (event) {
      let activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && event.document === activeEditor.document) {
        rainbowTags(activeEditor);
      }
    },
    null,
    context.subscriptions
  );
}

function rainbowTags(activeEditor: vscode.TextEditor): void {
  if (!activeEditor || !activeEditor.document) {
    return;
  }

  if (!supportedLanguages.includes(activeEditor.document.languageId) && allowEverywhere === false) {
    return;
  }

  let text: string = activeEditor.document.getText();

  let divsDecorationTypeMap: vscode.Range[][] = [];

  const tagRemover = (inputString: string): string => {
    let matchTag;

    const charactersBetweenTags: string = "([\\s\\S])*?";

    const regEx: RegExp = new RegExp([
      `<!--${charactersBetweenTags}-->`,
    
      ...(isLanguageUsed("vue") ? [
        `{{${charactersBetweenTags}}}`,
        `="${charactersBetweenTags}"`
      ] : [])
      
    ].join("|"), "gm");

    while (matchTag = regEx.exec(inputString)!) {
      let matchLen: number = matchTag[0].length;
      let repl: string = ' '.repeat(matchLen);

      inputString = inputString.substring(0, matchTag.index) + repl + inputString.substring(matchTag.index + matchLen);
    }
    return inputString;
  };

  const mapDecoratorTypes = (decoratorList: vscode.TextEditorDecorationType[]): vscode.Range[][] => {
    const returnArray: vscode.Range[][] = [];
    decoratorList.forEach((_, index) => {
      returnArray[index] = [];
    });
    return returnArray;
  };

  const assignTagColors = (inputText: string): void => {
    const regExTags: RegExp = /(<(?!(\?|%))\/?[^]+?(?<!(\?|%))>)/g;

    let matchTags;

    const openDivStack: number[] = [];

    const rightBracketsDecorationTypes: vscode.Range[] = [];

    let roundCalculate: number;

    let divsColorCount: number = 0;

    while ((matchTags = regExTags.exec(inputText)!)) {
      if (matchTags[0].substring(0, 2) === '</') {
        const matchAgainstDenylist: string = matchTags[0];
        if (denylistTagsFormattedEndings.includes(matchAgainstDenylist)) {
          continue;
        }

        let startPosEnding: vscode.Position = activeEditor.document.positionAt(matchTags.index);
        let endPosEnding: vscode.Position = activeEditor.document.positionAt(matchTags.index + matchTags[0].indexOf('>') + 1);
        let decorationEnding: vscode.DecorationOptions = {
          range: new vscode.Range(startPosEnding, endPosEnding),
          hoverMessage: undefined
        };
        if (openDivStack.length > 0) {
          roundCalculate = openDivStack.pop()!;
          divsColorCount = roundCalculate;
          divsDecorationTypeMap[roundCalculate].push(decorationEnding as unknown as vscode.Range);
        } else {
          rightBracketsDecorationTypes.push(decorationEnding as unknown as vscode.Range);
        }
      } else if (matchTags[0].substring(0, 1) === '<') {
        const matchAgainstDenylist: string = matchTags[0];
        const matchAgainstDenylistFirstWhitespace: string = matchTags[0].substr(0, matchTags[0].indexOf(' ') + 1);
        const matchAgainstDenylistFirstLinebreak = matchTags[0].match(/[^\r\n]+/g)!;

        if (denylistTagsFormattedBeginnings.includes(matchAgainstDenylist)) {
          continue;
        }

        if (denylistTagsFormattedBeginningsWithWhitespaces.includes(matchAgainstDenylistFirstWhitespace)) {
          continue;
        }

        if (denylistTagsFormattedBeginningsWithLinebreaks.includes(matchAgainstDenylistFirstLinebreak[0])) {
          continue;
        }

        const tagOpening: string = matchTags[0].slice(0, 1);
        const tagClosing: string = matchTags[0].slice(-2);
        let sameLevel = false;
        if (tagOpening === '<' && tagClosing === '/>') {
          sameLevel = true;
        } else if (matchTags[0].slice(0, 2) === '<!') {
          sameLevel = true;
        }

        let startPosOpening: vscode.Position = activeEditor.document.positionAt(matchTags.index);

        let endPosOpening: vscode.Position;

        if (matchTags[0].indexOf(' ') !== -1) {
          endPosOpening = activeEditor.document.positionAt(matchTags.index + matchTags[0].indexOf(' '));
        } else {
          endPosOpening = activeEditor.document.positionAt(matchTags.index + matchTags[0].indexOf('>'));
        }

        let closeTagStartPos: vscode.Position = activeEditor.document.positionAt(
          regExTags.lastIndex - 1
        );
        let closeTagEndPos: vscode.Position = activeEditor.document.positionAt(regExTags.lastIndex);
        let decorationOpening: vscode.DecorationOptions = {
          range: new vscode.Range(startPosOpening, endPosOpening),
          hoverMessage: undefined
        };
        let closeTagDecoration: vscode.DecorationOptions = {
          range: new vscode.Range(closeTagStartPos, closeTagEndPos),
          hoverMessage: undefined
        };
        roundCalculate = divsColorCount;
        if (!sameLevel) {
          openDivStack.push(roundCalculate);
        }
        
        divsColorCount++;
        if (divsColorCount >= tagColorList.length) {
          divsColorCount = 0;
        }
        divsDecorationTypeMap[roundCalculate].push(decorationOpening as unknown as vscode.Range);
        divsDecorationTypeMap[roundCalculate].push(closeTagDecoration as unknown as vscode.Range);
      }
    }

    for (let tagDecorator in tagDecoratorList) {
      activeEditor.setDecorations(
        tagDecoratorList[tagDecorator],
        divsDecorationTypeMap[tagDecorator]
      );
    }

    activeEditor.setDecorations(
      isolatedRightBracketsDecorationTypes,
      rightBracketsDecorationTypes
    );
  };

  text = tagRemover(text);

  divsDecorationTypeMap = mapDecoratorTypes(tagDecoratorList);

  assignTagColors(text);
}

export function deactivate(): void {}