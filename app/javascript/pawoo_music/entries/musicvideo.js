import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { IntlProvider, addLocaleData } from 'react-intl';
import store from '../../mastodon/store';
import { getLocale } from '../../mastodon/locales';
import EmbedMusicvideo from '../components/embed_musicvideo';


const { localeData, messages } = getLocale();
addLocaleData(localeData);

export default class MusicvideoEntry extends React.PureComponent {

  static propTypes = {
    status: PropTypes.object.isRequired,
    locale: PropTypes.string.isRequired,
  }

  render () {
    const { locale, status } = this.props;

    return (
      <IntlProvider locale={locale} messages={messages}>
        <Provider store={store}>
          <EmbedMusicvideo status={status} />
        </Provider>
      </IntlProvider>
    );
  }

}