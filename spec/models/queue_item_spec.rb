require 'rails_helper'

RSpec.describe QueueItem do
  describe '.create_from_link' do
    subject { described_class.create_from_link(url, account) }

    before do
      Redis.current.flushdb
    end

    let(:account) { Fabricate(:account) }

    let(:booth_api_response) do
      {
        "body": {
          "id": 1,
          "name": "name",
          "url": "https://test.booth.pm/items/1",
          "primary_image": {},
          "variation_types": ["digital", "via_warehouse"],
          "published_at": 1,
          "price": 100,
          "price_str": "400 JPY~",
          "description": "description",
          "adult": false,
          "market_url": "https://booth.pm/zh-tw/items/1",
          "sound": {
            "short_url": "https://s.booth.pm/XXXXXXXX-1234-1234-1234-XXXXXXXXXXXX/s/1/short/XXXXXXXX-1234-1234-1234-XXXXXXXXXXXX.mp3",
            "long_url": "https://s.booth.pm/XXXXXXXX-1234-1234-1234-XXXXXXXXXXXX/s/1/full/XXXXXXXX-1234-1234-1234-XXXXXXXXXXXX.mp3",
            "duration": 91
          },
          "shop": {
            "name": "shop_name",
            "description": "description",
            "websites": [],
            "subdomain": "test",
            "url": "https://test.booth.pm/",
            "user": {
              "nickname": "nickname",
              "icon_image": {},
              "pixiv_user_id": nil
            }
          },
        }
      }
    end

    shared_examples_for 'instance from booth response' do
      it { is_expected.to be_present }

      it 'replaces s.booth.pm with img-music.pawoo.net' do
        expect(subject.music_url).to start_with('https://img-music.pawoo.net/booth/')
      end
    end

    context 'given pawoo link' do
      let(:url) { Rails.application.routes.url_helpers.short_account_status_url(status.account, status) }
      let(:status) { Fabricate(:status, account: account) }

      context "when status hasn't attachments" do
        it { is_expected.to be_nil }
      end

      context "when status has image attachments" do
        let!(:media_attachment) { Fabricate(:media_attachment, status: status) }
        it { is_expected.to be_nil }
      end

      context "when status has video attachments" do
        let!(:media_attachment) { Fabricate(:media_attachment, status: status, type: 'video', music_info: music_info) }
        let(:music_info) { { title: 'title', artist: 'artist', duration: 1 } }

        it { is_expected.to be_present }

        context 'status is unlisted' do
          let(:status) { Fabricate(:status, account: account, visibility: 'unlisted') }
          it { is_expected.to be_present }
        end

        context 'status is direct' do
          let(:status) { Fabricate(:status, account: account, visibility: 'direct') }
          it { is_expected.to be_nil }
        end

        context 'status is private' do
          let(:status) { Fabricate(:status, account: account, visibility: 'private') }
          it { is_expected.to be_nil }
        end
      end
    end

    context 'given booth link' do
      before do
        stub_request(:get, 'https://api.booth.pm/pixiv/items/1').and_return(body: booth_api_response.to_json)
      end

      context 'invalid url' do
        let(:url) { 'https://booth.pm/ja/browse/1' }
        it { is_expected.to be_nil }
      end

      context 'market url' do
        let(:url) { 'https://booth.pm/ja/items/1' }
        it_behaves_like 'instance from booth response'
      end

      context 'shop url' do
        let(:url) { 'https://test.booth.pm/items/1' }
        it_behaves_like 'instance from booth response'
      end

      context 'localized url' do
        let(:url) { 'https://booth.pm/zh-tw/items/1' }
        it_behaves_like 'instance from booth response'
      end

      describe '#source_type' do
        let(:url) { 'https://booth.pm/ja/items/1' }
        it { expect(subject.source_type).to eq('booth') }
      end
    end

    context 'given apollo link' do
      let(:url) { 'https://booth.pm/apollo/a06/item?id=1' }

      before do
        stub_request(:get, 'https://api.booth.pm/pixiv/items/1').and_return(body: booth_api_response.to_json)
      end

      it_behaves_like 'instance from booth response'

      describe '#source_type' do
        it { expect(subject.source_type).to eq('apollo') }
      end
    end

    context 'given youtube link' do
      let(:youtube_api_response) do
        {
          "kind": "youtube#videoListResponse",
          "pageInfo": {
            "totalResults": 1,
            "resultsPerPage": 1
          },
          "items": [
            {
              "id": "1",
              "kind": "youtube#video",
              "contentDetails": {
                "duration": "PT5M",
                "dimension": "2d",
                "definition": "hd",
                "caption": "false",
                "licensedContent": true,
                "regionRestriction": {
                  "blocked": []
                },
                "projection": "rectangular"
              }
            }
          ]
        }
      end

      let(:oembed_status) { 200 }

      let(:youtube_oembed_response) do
        {
          "height": 270,
          "author_name": "author_name",
          "thumbnail_url": "",
          "type": "video",
          "thumbnail_width": 480,
          "provider_url": "https:\/\/www.youtube.com\/",
          "version": "1.0",
          "thumbnail_height": 360,
          "author_url": "https:\/\/www.youtube.com\/user\/author_url",
          "title": "test",
          "width": 480,
          "provider_name": "YouTube"
        }
      end

      before do
        api_url = "https://www.googleapis.com/youtube/v3/videos?key=#{ENV['YOUTUBE_API_KEY']}&part=contentDetails&id=1"
        stub_request(:get, api_url).and_return(body: youtube_api_response.to_json)

        oembed_url = "https://www.youtube.com/oembed?url=#{url}"
        stub_request(:get, oembed_url).and_return(status: oembed_status, body: youtube_oembed_response.to_json)
      end

      context 'long youtube link' do
        let(:url) { 'https://www.youtube.com/watch?v=1' }
        it { is_expected.to be_present }
      end

      context 'short youtube link' do
        let(:url) { 'https://youtu.be/1' }
        it { is_expected.to be_present }
      end

      context 'not found' do
        let(:url) { 'https://youtu.be/1' }
        let(:youtube_oembed_status) { 404 }
        let(:youtube_oembed_response) { 'Not Found' }
        it { is_expected.to be_nil }
      end
    end
  end

  describe '#link=' do
    subject do
      instance = described_class.new(link: link)
      instance.link
    end

    context 'given invalid link' do
      let(:link) { 'https://booth.pm/apollo/a06/item?id=159897 aaaa' }
      it { is_expected.to eq('https://booth.pm/apollo/a06/item?id=159897') }
    end

    context 'given string' do
      let(:link) { 'hello' }
      it { is_expected.to be_nil }
    end

    context 'given nil' do
      let(:link) { nil }
      it { is_expected.to be_nil }
    end
  end
end
