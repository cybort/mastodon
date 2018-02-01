import {
  TRACK_COMPOSE_BASIC_TAB_FOCUS,
  TRACK_COMPOSE_VIDEO_TAB_FOCUS,
  TRACK_COMPOSE_TRACK_TITLE_CHANGE,
  TRACK_COMPOSE_TRACK_ARTIST_CHANGE,
  TRACK_COMPOSE_TRACK_TEXT_CHANGE,
  TRACK_COMPOSE_TRACK_VISIBILITY_CHANGE,
  TRACK_COMPOSE_TRACK_MUSIC_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_BACKGROUNDCOLOR_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_IMAGE_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_CIRCLE_ENABLED_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_CIRCLE_RAD_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_CIRCLE_SCALE_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_CIRCLE_SPEED_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_RANDOM_ENABLED_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_RANDOM_SCALE_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_RANDOM_SPEED_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_ZOOM_ENABLED_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_ZOOM_SCALE_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_ZOOM_SPEED_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_BLUR_VISIBLITY_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_BLUR_MOVEMENT_THRESHOLD_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_BLUR_BLINK_THRESHOLD_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_VISIBLITY_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_ALPHA_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_COLOR_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_LIMIT_THRESHOLD_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_VISIBILITY_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_ALPHA_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_INTERVAL_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_VISIBLITY_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_MODE_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_ALPHA_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_COLOR_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_TEXT_VISIBILITY_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_TEXT_ALPHA_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_TEXT_COLOR_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_BANNER_VISIBILITY_CHANGE,
  TRACK_COMPOSE_TRACK_VIDEO_BANNER_ALPHA_CHANGE,
  TRACK_COMPOSE_SUBMIT_REQUEST,
  TRACK_COMPOSE_SUBMIT_SUCCESS,
  TRACK_COMPOSE_SUBMIT_FAIL,
  TRACK_COMPOSE_SHOW_MODAL,
  TRACK_COMPOSE_HIDE_MODAL,
  TRACK_COMPOSE_RESET_DATA,
  TRACK_COMPOSE_SET_DATA,
  TRACK_COMPOSE_CHANGE_PRIVACY,
} from '../actions/track_compose';
import Immutable from 'immutable';

const initialState = Immutable.fromJS({
  error: null,
  is_submitting: false,
  modal: false,
  tab: 'basic',
  track: {
    music: null,
    title: '',
    artist: '',
    text: '',
    visibility: 'public',
    video: {
      backgroundcolor: 0x171717,
      image: null,
      sprite: {
        visible: true,
        movement: {
          circle: { enabled: false, rad: Math.PI / 16, scale: 0.2, speed: 0.2 },
          random: { enabled: false, scale: 50, speed: 0.1 },
          zoom: { enabled: false, scale: 0.1, speed: 0.5 },
        },
      },
      blur: {
        visible: false,
        movement: { threshold: 190, band: { bottom: 50, top: 300 } },
        blink: { threshold: 150, band: { bottom: 2000, top: 11025 } },
      },
      particle: {
        visible: false,
        alpha: 0.9,
        color: 0xffffff,
        limit: { threshold: 190, band: { bottom: 300, top: 2000 } },
      },
      lightleaks: { visible: false, alpha: 1, interval: 0 },
      spectrum: {
        visible: true,
        mode: 1,
        alpha: 1,
        color: 0xffffff,
      },
      text: { visible: true, alpha: 0.9, color: 0xffffff },
      banner: { visible: true, alpha: 1 },
    },
  },
});

function convertTrackData(track) {
  return initialState.get('track').withMutations((map) => {
    map.mergeDeep(track);

    ['circle', 'random', 'zoom'].forEach(movementKey => {
      if (track.hasIn(['video', 'sprite', 'movement', movementKey])) {
        map.setIn(['video', 'sprite', 'movement', movementKey, 'enabled'], true);
      }
    });

    ['blur', 'particle', 'lightleaks', 'spectrum', 'text', 'banner'].forEach(trackKey => {
      if (map.getIn(['video', trackKey, 'visible'])) {
        return;
      }

      // visibleがfalseの場合は保存された値がすべて0なので、代わりにデフォルト値を使用する
      const defaultParam = initialState.getIn(['track', 'video', trackKey]);
      map.setIn(['video', trackKey], defaultParam.set('visible', false));
    });
  });
}

export default function track_compose(state = initialState, action) {
  switch(action.type) {
  case TRACK_COMPOSE_BASIC_TAB_FOCUS:
    return state.set('tab', 'basic');
  case TRACK_COMPOSE_VIDEO_TAB_FOCUS:
    return state.set('tab', 'video');
  case TRACK_COMPOSE_TRACK_TITLE_CHANGE:
    return state.setIn(['track', 'title'], action.value);
  case TRACK_COMPOSE_TRACK_ARTIST_CHANGE:
    return state.setIn(['track', 'artist'], action.value);
  case TRACK_COMPOSE_TRACK_TEXT_CHANGE:
    return state.setIn(['track', 'text'], action.value);
  case TRACK_COMPOSE_TRACK_VISIBILITY_CHANGE:
    return state.setIn(['track', 'visibility'], action.value);
  case TRACK_COMPOSE_TRACK_MUSIC_CHANGE:
    return state.setIn(['track', 'music'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_BACKGROUNDCOLOR_CHANGE:
    return state.setIn(['track', 'video', 'backgroundcolor'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_IMAGE_CHANGE:
    return state.setIn(['track', 'video', 'image'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_CIRCLE_ENABLED_CHANGE:
    return state.setIn(['track', 'video', 'sprite', 'movement', 'circle', 'enabled'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_CIRCLE_RAD_CHANGE:
    return state.setIn(['track', 'video', 'sprite', 'movement', 'circle', 'rad'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_CIRCLE_SCALE_CHANGE:
    return state.setIn(['track', 'video', 'sprite', 'movement', 'circle', 'scale'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_CIRCLE_SPEED_CHANGE:
    return state.setIn(['track', 'video', 'sprite', 'movement', 'circle', 'speed'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_RANDOM_ENABLED_CHANGE:
    return state.setIn(['track', 'video', 'sprite', 'movement', 'random', 'enabled'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_RANDOM_SCALE_CHANGE:
    return state.setIn(['track', 'video', 'sprite', 'movement', 'random', 'scale'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_RANDOM_SPEED_CHANGE:
    return state.setIn(['track', 'video', 'sprite', 'movement', 'random', 'speed'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_ZOOM_ENABLED_CHANGE:
    return state.setIn(['track', 'video', 'sprite', 'movement', 'zoom', 'enabled'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_ZOOM_SCALE_CHANGE:
    return state.setIn(['track', 'video', 'sprite', 'movement', 'zoom', 'scale'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPRITE_MOVEMENT_ZOOM_SPEED_CHANGE:
    return state.setIn(['track', 'video', 'sprite', 'movement', 'zoom', 'speed'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_BLUR_VISIBLITY_CHANGE:
    return state.setIn(['track', 'video', 'blur', 'visible'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_BLUR_MOVEMENT_THRESHOLD_CHANGE:
    return state.setIn(['track', 'video', 'blur', 'movement', 'threshold'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_BLUR_BLINK_THRESHOLD_CHANGE:
    return state.setIn(['track', 'video', 'blur', 'blink', 'threshold'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_VISIBLITY_CHANGE:
    return state.setIn(['track', 'video', 'particle', 'visible'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_ALPHA_CHANGE:
    return state.setIn(['track', 'video', 'particle', 'alpha'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_COLOR_CHANGE:
    return state.setIn(['track', 'video', 'particle', 'color'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_PARTICLE_LIMIT_THRESHOLD_CHANGE:
    return state.setIn(['track', 'video', 'particle', 'limit', 'threshold'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_VISIBILITY_CHANGE:
    return state.setIn(['track', 'video', 'lightleaks', 'visible'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_ALPHA_CHANGE:
    return state.setIn(['track', 'video', 'lightleaks', 'alpha'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_LIGHTLEAKS_INTERVAL_CHANGE:
    return state.setIn(['track', 'video', 'lightleaks', 'interval'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_VISIBLITY_CHANGE:
    return state.setIn(['track', 'video', 'spectrum', 'visible'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_MODE_CHANGE:
    return state.setIn(['track', 'video', 'spectrum', 'mode'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_ALPHA_CHANGE:
    return state.setIn(['track', 'video', 'spectrum', 'alpha'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_SPECTRUM_COLOR_CHANGE:
    return state.setIn(['track', 'video', 'spectrum', 'color'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_TEXT_VISIBILITY_CHANGE:
    return state.setIn(['track', 'video', 'text', 'visible'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_TEXT_ALPHA_CHANGE:
    return state.setIn(['track', 'video', 'text', 'alpha'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_TEXT_COLOR_CHANGE:
    return state.setIn(['track', 'video', 'text', 'color'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_BANNER_VISIBILITY_CHANGE:
    return state.setIn(['track', 'video', 'banner', 'visible'], action.value);
  case TRACK_COMPOSE_TRACK_VIDEO_BANNER_ALPHA_CHANGE:
    return state.setIn(['track', 'video', 'banner', 'alpha'], action.value);
  case TRACK_COMPOSE_SUBMIT_REQUEST:
    return state.set('is_submitting', true).set('error', initialState.get('error'));
  case TRACK_COMPOSE_SUBMIT_SUCCESS:
    return initialState;
  case TRACK_COMPOSE_SUBMIT_FAIL:
    return state.set('is_submitting', false).set('error', action.error);
  case TRACK_COMPOSE_SHOW_MODAL:
    return state.set('modal', true);
  case TRACK_COMPOSE_HIDE_MODAL:
    return state.set('modal', false);
  case TRACK_COMPOSE_RESET_DATA:
    return state.set('track', initialState.get('track'));
  case TRACK_COMPOSE_SET_DATA:
    return state.set('track', convertTrackData(action.track));
  case TRACK_COMPOSE_CHANGE_PRIVACY:
    return state.setIn(['track', 'visibility'], action.value);
  default:
    return state;
  }
}