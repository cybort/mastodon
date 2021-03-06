import React from 'react';
import DateTime from 'react-datetime';
import CharacterCounter from './character_counter';
import Button from '../../../components/button';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ReplyIndicatorContainer from '../containers/reply_indicator_container';
import AutosuggestTextarea from '../../../components/autosuggest_textarea';
import HashtagEditor from '../../../components/hashtag_editor';
import UploadButtonContainer from '../containers/upload_button_container';
import { defineMessages, injectIntl } from 'react-intl';
import Collapsable from '../../../components/collapsable';
import SpoilerButtonContainer from '../containers/spoiler_button_container';
import PrivacyDropdownContainer from '../containers/privacy_dropdown_container';
import SensitiveButtonContainer from '../containers/sensitive_button_container';
import SensitiveGuideContainer from '../containers/sensitive_guide_container';
import EmojiPickerDropdown from '../containers/emoji_picker_dropdown_container';
import TimeLimitDropdownContainer from '../containers/time_limit_dropdown_container';
import UploadFormContainer from '../containers/upload_form_container';
import WarningContainer from '../containers/warning_container';
import { isMobile } from '../../../is_mobile';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { length } from 'stringz';
import { countableText } from '../util/counter';

// TODO: i18n
// Moment is used by react-datetime, which is imported only by this module.
// Fix the setting to ja for now because the default display is confusing for
// Japanese people.
import 'moment/locale/ja';

const allowedAroundShortCode = '><\u0085\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029\u0009\u000a\u000b\u000c\u000d';

const messages = defineMessages({
  placeholder: { id: 'compose_form.placeholder', defaultMessage: 'What is on your mind?' },
  spoiler_placeholder: { id: 'compose_form.spoiler_placeholder', defaultMessage: 'Write your warning here' },
  schedule_placeholder: { id: 'compose_form.schedule_placeholder', defaultMessage: 'Time to post' },
  hashtag_editor_placeholder: { id: 'compose_form.hashtag_editor_placeholder', defaultMessage: 'Append tag (press enter to add)' },
  publish: { id: 'compose_form.publish', defaultMessage: 'Toot' },
  publishLoud: { id: 'compose_form.publish_loud', defaultMessage: '{publish}!' },
});

@injectIntl
export default class ComposeForm extends ImmutablePureComponent {

  static propTypes = {
    scheduling: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    text: PropTypes.string.isRequired,
    published: PropTypes.any,
    suggestion_token: PropTypes.string,
    suggestions: ImmutablePropTypes.list,
    spoiler: PropTypes.bool,
    privacy: PropTypes.string,
    spoiler_text: PropTypes.string,
    focusDate: PropTypes.instanceOf(Date),
    preselectDate: PropTypes.instanceOf(Date),
    is_submitting: PropTypes.bool,
    is_uploading: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onClearSuggestions: PropTypes.func.isRequired,
    onFetchSuggestions: PropTypes.func.isRequired,
    onSuggestionSelected: PropTypes.func.isRequired,
    onChangeDateTime: PropTypes.func.isRequired,
    onChangeSpoilerText: PropTypes.func.isRequired,
    onPaste: PropTypes.func.isRequired,
    onPickEmoji: PropTypes.func.isRequired,
    showSearch: PropTypes.bool,
    onSelectTimeLimit: PropTypes.func.isRequired,
    onInsertHashtag: PropTypes.func.isRequired,
    anyMedia: PropTypes.bool,
  };

  static defaultProps = {
    showSearch: false,
  };

  state = { tagSuggestionFrom: null }
  _restoreCaret = null;

  handleChange = (e) => {
    this.props.onChange(e.target.value);
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 13 && (e.ctrlKey || e.metaKey)) {
      this.handleSubmit();
    }
  }

  handleSubmit = () => {
    if (this.props.text !== this.autosuggestTextarea.textarea.value) {
      // Something changed the text inside the textarea (e.g. browser extensions like Grammarly)
      // Update the state to match the current text
      this.props.onChange(this.autosuggestTextarea.textarea.value);
    }

    if (!this.props.scheduling || this.props.published !== null) {
      this.props.onSubmit();
    }
  }

  onSuggestionsClearRequested = () => {
    this.props.onClearSuggestions();
    this.setState({ tagSuggestionFrom: null });
  }

  onSuggestionsFetchRequested = (token) => {
    this.setState({ tagSuggestionFrom: 'autosuggested-textarea' });
    this.props.onFetchSuggestions(token);
  }

  onSuggestionSelected = (tokenStart, token, value) => {
    this._restoreCaret = 'suggestion';
    this.props.onSuggestionSelected(tokenStart, token, value);
    this.setState({ tagSuggestionFrom: null });
  }

  onHashTagSuggestionsFetchRequested = (token) => {
    this.setState({ tagSuggestionFrom: 'hashtag-editor' });
    this.props.onFetchSuggestions(`#${token}`);
  }

  handleChangeSpoilerText = (e) => {
    this.props.onChangeSpoilerText(e.target.value);
  }

  componentWillReceiveProps (nextProps) {
    // If this is the update where we've finished uploading,
    // save the last caret position so we can restore it below!
    if ((!nextProps.is_uploading && this.props.is_uploading) || this._restoreCaret === null) {
      this._restoreCaret = this.autosuggestTextarea.textarea.selectionStart;
    } else if (this._restoreCaret === 'suggestion') {
      const diff = nextProps.text.length - this.props.text.length;
      this._restoreCaret = this.autosuggestTextarea.textarea.selectionStart + diff;
    }
  }

  componentDidUpdate (prevProps) {
    // This statement does several things:
    // - If we're beginning a reply, and,
    //     - Replying to zero or one users, places the cursor at the end of the textbox.
    //     - Replying to more than one user, selects any usernames past the first;
    //       this provides a convenient shortcut to drop everyone else from the conversation.
    // - If we've just finished uploading an image, and have a saved caret position,
    //   restores the cursor to that position after the text changes!
    if (this.props.focusDate !== prevProps.focusDate || (prevProps.is_uploading && !this.props.is_uploading && typeof this._restoreCaret === 'number')) {
      let selectionEnd, selectionStart;

      if (this.props.preselectDate !== prevProps.preselectDate) {
        selectionEnd   = this.props.text.length;
        selectionStart = this.props.text.search(/\s/) + 1;
      } else if (typeof this._restoreCaret === 'number') {
        selectionStart = this._restoreCaret;
        selectionEnd   = this._restoreCaret;
      } else {
        selectionEnd   = this.props.text.length;
        selectionStart = selectionEnd;
      }

      this.autosuggestTextarea.textarea.setSelectionRange(selectionStart, selectionEnd);
      this.autosuggestTextarea.textarea.focus();
    } else if(prevProps.is_submitting && !this.props.is_submitting) {
      this.autosuggestTextarea.textarea.focus();
    }
    this._restoreCaret = null;
  }

  setAutosuggestTextarea = (c) => {
    this.autosuggestTextarea = c;
  }

  handleEmojiPick = (data) => {
    const { text }     = this.props;
    const position     = this.autosuggestTextarea.textarea.selectionStart;
    const emojiChar    = data.native;
    const needsSpace   = data.custom && position > 0 && !allowedAroundShortCode.includes(text[position - 1]);

    this._restoreCaret = position + emojiChar.length + 1 + (needsSpace ? 1 : 0);
    this.props.onPickEmoji(position, data, needsSpace);
  }

  handleSelectTimeLimit = (data) => {
    this._restoreCaret = this.autosuggestTextarea.textarea.selectionStart;
    this.props.onSelectTimeLimit(data);
  }

  render () {
    const { scheduling, intl, onPaste, showSearch, anyMedia } = this.props;
    const { tagSuggestionFrom } = this.state;
    const disabled = this.props.is_submitting;
    const text     = [this.props.spoiler_text, countableText(this.props.text)].join('');
    const disabledButton = disabled || this.props.is_uploading || typeof this.props.published === 'string' || length(text) > 500 || (text.length !== 0 && text.trim().length === 0 && !anyMedia);
    let publishText = '';

    if (this.props.privacy === 'private' || this.props.privacy === 'direct') {
      publishText = <span className='compose-form__publish-private'><i className='fa fa-lock' /> {intl.formatMessage(messages.publish)}</span>;
    } else {
      publishText = this.props.privacy !== 'unlisted' ? intl.formatMessage(messages.publishLoud, { publish: intl.formatMessage(messages.publish) }) : intl.formatMessage(messages.publish);
    }

    return (
      <div className='compose-form'>
        <WarningContainer />

        <Collapsable isVisible={this.props.spoiler} fullHeight={50}>
          <div className='spoiler-input'>
            <label>
              <span style={{ display: 'none' }}>{intl.formatMessage(messages.spoiler_placeholder)}</span>
              <input placeholder={intl.formatMessage(messages.spoiler_placeholder)} value={this.props.spoiler_text} onChange={this.handleChangeSpoilerText} onKeyDown={this.handleKeyDown} type='text' className='spoiler-input__input'  id='cw-spoiler-input' />
            </label>
          </div>
        </Collapsable>

        <ReplyIndicatorContainer />

        <div className='compose-form__autosuggest-wrapper'>
          <AutosuggestTextarea
            ref={this.setAutosuggestTextarea}
            placeholder={intl.formatMessage(messages.placeholder)}
            disabled={disabled}
            value={this.props.text}
            onChange={this.handleChange}
            suggestions={tagSuggestionFrom === 'autosuggested-textarea' ? this.props.suggestions : Immutable.List()}
            onKeyDown={this.handleKeyDown}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            onSuggestionSelected={this.onSuggestionSelected}
            onPaste={onPaste}
            autoFocus={!showSearch && !isMobile(window.innerWidth)}
          />

          <EmojiPickerDropdown onPickEmoji={this.handleEmojiPick} />
          <TimeLimitDropdownContainer onSelectTimeLimit={this.handleSelectTimeLimit} />
        </div>

        <div className='compose-form__modifiers'>
          <UploadFormContainer />
          <HashtagEditor
            placeholder={intl.formatMessage(messages.hashtag_editor_placeholder)}
            disabled={disabled}
            suggestions={tagSuggestionFrom === 'hashtag-editor' ? this.props.suggestions : Immutable.List()}
            onSuggestionsFetchRequested={this.onHashTagSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            onInsertHashtag={this.props.onInsertHashtag}
          />
        </div>

        <div className='compose-form__buttons-wrapper'>
          <div className='compose-form__buttons'>
            <UploadButtonContainer />
            <PrivacyDropdownContainer />
            <SensitiveButtonContainer />
            <SpoilerButtonContainer />
          </div>
          <div className='character-counter__wrapper'><CharacterCounter max={500} text={text} /></div>
        </div>

        <div className='compose-form__publish'>
          {scheduling && (
            <DateTime
              className='compose-form__datetime'
              inputProps={{
                className: 'compose-form__datetime-input',
                placeholder: intl.formatMessage(messages.schedule_placeholder),
              }}
              onChange={this.props.onChangeDateTime}
              value={this.props.published}
            />
          )}

          <div className='compose-form__publish-button-wrapper'><Button text={publishText} onClick={this.handleSubmit} disabled={disabledButton} block /></div>
        </div>

        <SensitiveGuideContainer />
      </div>
    );
  }

}
