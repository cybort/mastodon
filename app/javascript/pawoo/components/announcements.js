import React from 'react';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import IconButton from '../../mastodon/components/icon_button';
import PawooGA from '../actions/ga';
import { upgradeLayout } from '../actions/layout';

import icon from '../images/announcement_icon.png';

const pawooGaCategory = 'Announcement';
const storageKey = 'announcements_dismissed';

const messages = defineMessages({
  dismiss: { id: 'pawoo.announcements.dismiss', defaultMessage: 'Dismiss' },
});

const mapStateToProps = state => ({
  hasPinnedColumn: state.getIn(['settings', 'columns']).count() > 1,
});

// NOTE: id: 18 まで使用した
const announcements = [
  {
    id: 1,
    icon,
    body: 'iOS・AndroidでもPawoo！Pawooアプリを使おう！',
    link: [
      {
        reactRouter: false,
        inline: true,
        href: 'https://itunes.apple.com/us/app/%E3%83%9E%E3%82%B9%E3%83%88%E3%83%89%E3%83%B3%E3%82%A2%E3%83%97%E3%83%AA-pawoo/id1229070679?l=ja&ls=1&mt=8',
        body: 'Appストア',
      }, {
        reactRouter: false,
        inline: true,
        href: 'https://play.google.com/store/apps/details?id=jp.pxv.pawoo&hl=ja',
        body: 'Google Playストア',
      },
    ],
  }, {
    id: 7,
    icon,
    body: 'Pawooにどんなユーザーさんがいるのか見てみよう！',
    link: [
      {
        reactRouter: true,
        inline: false,
        href: '/suggested_accounts',
        body: 'おすすめユーザー（実験中）',
      },
    ],
  },
];

@injectIntl
@connect(mapStateToProps)
class Announcements extends React.PureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    hasPinnedColumn: PropTypes.bool.isRequired,
  };

  constructor (props, context) {
    super(props, context);

    try {
      const dismissed = JSON.parse(localStorage.getItem(storageKey));
      this.state = { dismissed: Array.isArray(dismissed) ? dismissed : [] };
    } catch (e) {
      this.state = { dismissed: [] };
    }

    this.announcements = Immutable.fromJS(announcements);
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.dismissed !== this.state.dismissed) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(this.state.dismissed));
      } catch (e) {}
    }
  }

  handleDismiss = (event) => {
    const id = +event.currentTarget.getAttribute('value');

    if (Number.isInteger(id)) {
      this.setState({ dismissed: [].concat(this.state.dismissed, id) });
      PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'Dismiss', eventLabel: id });
    }
  }

  handleUpgradeLayout = event => {
    this.props.dispatch(upgradeLayout());
    event.preventDefault();
  }

  render () {
    const { hasPinnedColumn, intl } = this.props;
    const announcements = hasPinnedColumn ? this.announcements.unshift(Immutable.fromJS({
      id: 18,
      icon,
      body: 'Pawooの新しいレイアウトができました！',
      link: [
        {
          action: this.handleUpgradeLayout,
          body: '新しいレイアウトを試す',
          href: '',
        },
      ],
    })) : this.announcements;

    return (
      <ul className='announcements'>
        {announcements.map(announcement => this.state.dismissed.indexOf(announcement.get('id')) === -1 && (
          <li key={announcement.get('id')}>
            <div className='announcements__icon'>
              <img src={announcement.get('icon')} alt='' />
            </div>
            <div className='announcements__body'>
              <div className='announcements__body__dismiss'>
                <IconButton icon='close' value={`${announcement.get('id')}`} title={intl.formatMessage(messages.dismiss)} onClick={this.handleDismiss} />
              </div>
              <p>{announcement.get('body')}</p>
              <p>
                {announcement.get('link').map((link, index) => {
                  const classNames = ['announcements__link'];
                  const handleClick = event => {
                    PawooGA.event({ eventCategory: pawooGaCategory, eventAction: 'ClickButton', eventLabel: `${announcement.get('id')}-${index}` });

                    const action = link.get('action');
                    if (action) {
                      action(event);
                    }
                  };

                  if (link.get('inline')) {
                    classNames.push('announcements__link-inline');
                  }

                  /* eslint-disable react/jsx-no-bind */
                  if (link.get('reactRouter')) {
                    return (
                      <Link key={link.get('href')} className={classNames.join(' ')} to={link.get('href')} onClick={handleClick}>
                        {link.get('body')}
                      </Link>
                    );
                  } else {
                    return (
                      <a className={classNames.join(' ')} key={link.get('href')} href={link.get('href')} target='_blank' onClick={handleClick}>
                        {link.get('body')}
                      </a>
                    );
                  }
                  /* eslint-enable react/jsx-no-bind */
                })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

};

export default Announcements;