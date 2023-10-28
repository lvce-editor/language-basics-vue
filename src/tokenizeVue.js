/**
 * @enum number
 */
const State = {
  TopLevelContent: 1,
  AfterOpeningAngleBracket: 2,
  InsideOpeningTag: 3,
  InsideOpeningTagAndHasSeenWhitespace: 4,
  AfterClosingTagAngleBrackets: 5,
  AfterClosingTagName: 6,
  AfterAttributeName: 7,
  AfterAttributeEqualSign: 8,
  InsideAttributeDoubleQuote: 9,
  InsideBlockComment: 10,
  None: 11,
  InsideDoubleQuoteString: 12,
  InsideSingleQuoteString: 13,
  InsideScriptContent: 14,
  InsideStyleContent: 15,
}

export const StateMap = {}

/**
 * @enum number
 */
export const TokenType = {
  None: 99999999,
  Numeric: 30,
  String: 50,
  Whitespace: 0,
  Comment: 60,
  Text: 117,
  PunctuationTag: 228,
  TagName: 118,
  AttributeName: 119,
  Punctuation: 10,
  Error: 141,
  PunctuationString: 11,
  NewLine: 891,
  Embedded: 999,
}

export const TokenMap = {
  [TokenType.None]: 'None',
  [TokenType.Numeric]: 'Numeric',
  [TokenType.String]: 'String',
  [TokenType.Whitespace]: 'Whitespace',
  [TokenType.Comment]: 'Comment',
  [TokenType.Text]: 'Text',
  [TokenType.PunctuationTag]: 'PunctuationTag',
  [TokenType.TagName]: 'TagName',
  [TokenType.AttributeName]: 'AttributeName',
  [TokenType.Punctuation]: 'Punctuation',
  [TokenType.Error]: 'Error',
  [TokenType.PunctuationString]: 'PunctuationString',
  [TokenType.Embedded]: 'Embedded',
}

const RE_ANGLE_BRACKET_CLOSE = /^>/
const RE_ANGLE_BRACKET_ONLY = /^</
const RE_ANGLE_BRACKET_OPEN = /^</
const RE_ANGLE_BRACKET_OPEN_TAG = /^<(?![\s!])/
const RE_ANY_TEXT = /^[^\n]+/
const RE_ATTRIBUTE_NAME = /^#?[\@a-zA-Z\d\-\:\.]+/
const RE_BLOCK_COMMENT_CONTENT_1 = /^.+?(?=-->)/s
const RE_BLOCK_COMMENT_CONTENT_2 = /^.+$/s
const RE_BLOCK_COMMENT_END = /^-->/
const RE_BLOCK_COMMENT_START = /^<!--/
const RE_DOCTYPE = /^<!(?=\w)/
const RE_DASH_DASH = /^\-\-/
const RE_DOUBLE_QUOTE = /^"/
const RE_EQUAL_SIGN = /^=/
const RE_EXCLAMATION_MARK = /^!/
const RE_INVALID_INSIDE_ClOSING_TAG = /^[^a-zA-Z>]/
const RE_INVALID_INSIDE_OPENING_TAG = /^[^a-zA-Z>]/
const RE_NEWLINE = /^\n/
const RE_NEWLINE_WHITESPACE = /^\n\s*/
const RE_NOT_TAGNAME = /^[^a-zA-Z\d]+/
const RE_PUNCTUATION = /^[<;'".,]/
const RE_PUNCTUATION_SELF_CLOSING = /^\/>/
const RE_SELF_CLOSING = /^\/>/
const RE_SINGLE_QUOTE = /^'/
const RE_SLASH = /^\//
const RE_STRING_DOUBLE_QUOTE_CONTENT = /^[^"]+/
const RE_STRING_SINGLE_QUOTE_CONTENT = /^[^']+/
const RE_TAG_TEXT = /^[^\s>]+/
const RE_TAGNAME = /^[!\w]+/
const RE_TEXT = /^[^<>\n]+/
const RE_WHITESPACE = /^\s+/
const RE_WORD = /^[^\s]+/
const RE_ATTRIBUTE_VALUE_UNQUOTED = /^[^<>]+/
const RE_SCRIPT_CONTENT = /^..*?(?=(?:<\/script)|$)/s
const RE_SCRIPT_CONTENT_END = /^<\/script/
const RE_STYLE_CONTENT = /^..*?(?=(?:<\/(?:style|head))|$)/s
const RE_STYLE_CONTENT_END = /^<\/style/
const RE_STYLE_CONTENT_END_2 = /^<\/head/
const RE_TYPE = /^[^\s\>]+/

/**
 *
 * @param {string} attribute
 * @returns {string}
 */
const getEmbeddedLanguageId = (attribute) => {
  const attributeLowerCase = attribute.toLowerCase()
  switch (attributeLowerCase) {
    case 'js':
      return 'javascript'
    case 'ts':
      return 'typescript'
    case 'shell':
    case 'sh':
    case 'bash':
      return 'shellscript'
    case 'md':
      return 'markdown'
    case 'text':
      return 'plaintext'
    default:
      if (attributeLowerCase.includes(':')) {
        const parts = attributeLowerCase.split(':')
        const firstPart = parts[0]
        return getEmbeddedLanguageId(firstPart)
      }
      return attributeLowerCase
  }
}

export const initialLineState = {
  state: State.TopLevelContent,
  embeddedLanguage: '',
  embeddedLanguageStart: 0,
  embeddedLanguageEnd: 0,
  tag: '',
  type: '',
}

const getEmbeddedScriptLanguageId = () => {
  return 'javascript'
}

const getEmbeddedStyleLanguageId = () => {
  return 'css'
}

/**
 * @param {string} tag
 */
const getEmbeddedLangageId = (tag) => {
  switch (tag) {
    case 'script':
      return getEmbeddedScriptLanguageId()
    case 'style':
      return getEmbeddedStyleLanguageId()
    default:
      return ''
  }
}

/**
 *
 * @param {string} tag
 * @returns
 */
const getEmbeddedContentState = (tag) => {
  switch (tag) {
    case 'script':
      return State.InsideScriptContent
    case 'style':
      return State.InsideStyleContent
    default:
      return State.TopLevelContent
  }
}

/**
 *
 * @param {any} lineStateA
 * @param {any} lineStateB
 * @returns
 */
export const isLineStateEqual = (lineStateA, lineStateB) => {
  return lineStateA.state === lineStateB.state
}

export const hasArrayReturn = true

/**
 *
 * @param {string} line
 * @param {any} lineState
 * @returns
 */
export const tokenizeLine = (line, lineState) => {
  let next = null
  let index = 0
  let tokens = []
  let token = TokenType.None
  let state = lineState.state
  let tag = lineState.tag
  let embeddedLanguage = lineState.embeddedLanguage
  let embeddedLanguageStart = lineState.embeddedLanguageStart
  let embeddedLanguageEnd = lineState.embeddedLanguageEnd
  let specialTag = lineState.specialTag
  let attributeName = ''
  let type = ''
  while (index < line.length) {
    const part = line.slice(index)
    switch (state) {
      case State.TopLevelContent:
        if ((next = part.match(RE_ANGLE_BRACKET_OPEN_TAG))) {
          token = TokenType.PunctuationTag
          state = State.AfterOpeningAngleBracket
        } else if ((next = part.match(RE_TEXT))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else if ((next = part.match(RE_BLOCK_COMMENT_START))) {
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else if ((next = part.match(RE_ANGLE_BRACKET_CLOSE))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else if ((next = part.match(RE_DOCTYPE))) {
          token = TokenType.PunctuationTag
          state = State.AfterOpeningAngleBracket
        } else if ((next = part.match(RE_ANGLE_BRACKET_OPEN))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.AfterOpeningAngleBracket:
        if ((next = part.match(RE_TAGNAME))) {
          token = TokenType.TagName
          state = State.InsideOpeningTag
          tag = next[0]
          specialTag = tag === 'script' || tag === 'style'
        } else if ((next = part.match(RE_SLASH))) {
          token = TokenType.PunctuationTag
          state = State.AfterClosingTagAngleBrackets
        } else if ((next = part.match(RE_ANGLE_BRACKET_CLOSE))) {
          token = TokenType.PunctuationTag
          state = State.TopLevelContent
        } else if ((next = part.match(RE_ANGLE_BRACKET_OPEN))) {
          token = TokenType.PunctuationTag
          state = State.AfterOpeningAngleBracket
        } else if ((next = part.match(RE_ANY_TEXT))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.InsideOpeningTag:
        if ((next = part.match(RE_ANGLE_BRACKET_CLOSE))) {
          token = TokenType.PunctuationTag
          state = State.TopLevelContent
          const embeddedLanguageId = type || getEmbeddedLangageId(tag)
          if (embeddedLanguageId) {
            state = getEmbeddedContentState(tag)
            embeddedLanguage = embeddedLanguageId
            embeddedLanguageStart = index + next[0].length
          }
          specialTag = false
          type = ''
          attributeName = ''
        } else if ((next = part.match(RE_EXCLAMATION_MARK))) {
          token = TokenType.PunctuationTag
          state = State.InsideOpeningTag
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.InsideOpeningTagAndHasSeenWhitespace
        } else if ((next = part.match(RE_DASH_DASH))) {
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else if ((next = part.match(RE_TAG_TEXT))) {
          token = TokenType.Text
          state = State.InsideOpeningTag
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.AfterClosingTagAngleBrackets:
        if ((next = part.match(RE_TAGNAME))) {
          token = TokenType.TagName
          state = State.AfterClosingTagName
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.TopLevelContent
        } else if ((next = part.match(RE_ANY_TEXT))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.AfterClosingTagName:
        if ((next = part.match(RE_ANGLE_BRACKET_CLOSE))) {
          token = TokenType.PunctuationTag
          state = State.TopLevelContent
        } else if ((next = part.match(RE_TEXT))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else {
          throw new Error('no')
        }
        break
      case State.InsideOpeningTagAndHasSeenWhitespace:
        if ((next = part.match(RE_ATTRIBUTE_NAME))) {
          token = TokenType.AttributeName
          state = State.AfterAttributeName
          attributeName = next[0]
        } else if ((next = part.match(RE_SELF_CLOSING))) {
          token = TokenType.PunctuationTag
          state = State.TopLevelContent
        } else if ((next = part.match(RE_ANGLE_BRACKET_CLOSE))) {
          token = TokenType.PunctuationTag
          state = State.TopLevelContent
        } else if ((next = part.match(RE_TAG_TEXT))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.AfterAttributeName:
        if ((next = part.match(RE_ANGLE_BRACKET_CLOSE))) {
          token = TokenType.PunctuationTag
          state = State.TopLevelContent
        } else if ((next = part.match(RE_EQUAL_SIGN))) {
          token = TokenType.Punctuation
          state = State.AfterAttributeEqualSign
        } else if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.PunctuationString
          state = State.InsideDoubleQuoteString
        } else if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.PunctuationString
          state = State.InsideSingleQuoteString
        } else if ((next = part.match(RE_TAG_TEXT))) {
          token = TokenType.Text
          state = State.InsideOpeningTag
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.InsideOpeningTagAndHasSeenWhitespace
        } else {
          // TODO check quotation mark
          part //?
          throw new Error('no')
        }
        break
      case State.AfterAttributeEqualSign:
        if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.PunctuationString
          state = State.InsideDoubleQuoteString
        } else if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.PunctuationString
          state = State.InsideSingleQuoteString
        } else if ((next = part.match(RE_ANGLE_BRACKET_CLOSE))) {
          token = TokenType.PunctuationTag
          state = State.TopLevelContent
        } else if ((next = part.match(RE_ATTRIBUTE_VALUE_UNQUOTED))) {
          token = TokenType.String
          state = State.InsideOpeningTag
        } else {
          part
          throw new Error('no')
        }
        break
      case State.InsideDoubleQuoteString:
        if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.PunctuationString
          state = State.InsideOpeningTag
        } else if ((next = part.match(RE_STRING_DOUBLE_QUOTE_CONTENT))) {
          token = TokenType.String
          state = State.InsideDoubleQuoteString
        } else {
          throw new Error('no')
        }
        break
      case State.InsideSingleQuoteString:
        if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.PunctuationString
          state = State.InsideOpeningTag
        } else if ((next = part.match(RE_STRING_SINGLE_QUOTE_CONTENT))) {
          token = TokenType.String
          state = State.InsideSingleQuoteString
        } else {
          throw new Error('no')
        }
        break
      case State.InsideBlockComment:
        part
        if ((next = part.match(RE_BLOCK_COMMENT_CONTENT_1))) {
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else if ((next = part.match(RE_BLOCK_COMMENT_END))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else if ((next = part.match(RE_BLOCK_COMMENT_CONTENT_2))) {
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else {
          throw new Error('no')
        }
        break
      case State.InsideScriptContent:
        if ((next = part.match(RE_SCRIPT_CONTENT_END))) {
          token = TokenType.TagName
          state = State.AfterClosingTagName
          tokens.push(TokenType.PunctuationTag, 2, TokenType.TagName, 6)
          index += next[0].length
          embeddedLanguage = ''
          continue
        } else if ((next = part.match(RE_SCRIPT_CONTENT))) {
          token = TokenType.Embedded
          state = State.InsideScriptContent
          embeddedLanguageStart = index
          embeddedLanguageEnd = index + next[0].length
        } else {
          part
          throw new Error('no')
        }
        break
      case State.InsideStyleContent:
        if (
          (next =
            part.match(RE_STYLE_CONTENT_END) ||
            part.match(RE_STYLE_CONTENT_END_2))
        ) {
          token = TokenType.TagName
          state = State.AfterClosingTagName
          tokens.push(
            TokenType.PunctuationTag,
            2,
            TokenType.TagName,
            next[0].length - 1,
          )
          embeddedLanguageEnd = index
          index += next[0].length
          embeddedLanguage = ''
          continue
        } else if ((next = part.match(RE_STYLE_CONTENT))) {
          token = TokenType.Embedded
          state = State.InsideStyleContent
          embeddedLanguageStart = index
          embeddedLanguageEnd = index + next[0].length
        } else {
          part
          throw new Error('no')
        }
        break
      default:
        state
        throw new Error('no')
    }

    const tokenLength = next[0].length
    index += tokenLength
    tokens.push(token, tokenLength)
  }
  if (state === State.AfterClosingTagAngleBrackets) {
    state = State.TopLevelContent
  }
  return {
    state,
    tokens,
    tag,
    embeddedLanguage,
    embeddedLanguageStart,
    embeddedLanguageEnd,
    specialTag,
    type,
  }
}
