# frozen_string_literal: true

require 'rails_helper'

describe StatusesController, type: :controller do
  describe 'GET #show' do
    context 'the duration is set' do
      let(:tag) { Fabricate(:tag, name: 'exp1d') }
      let(:status) { Fabricate(:status, tags: [tag]) }

      subject { get :show, format: :json, params: { account_username: status.account.username, id: status } }

      it { is_expected.to have_http_status :not_found }
    end

    it 'sets the link for the previous status' do
      previous_status = Fabricate(:status)
      status = Fabricate(:status, account: previous_status.account)

      get :show, params: { account_username: status.account.username, id: status }

      expect(response.headers['Link'].find_link(['rel', 'prev']).href).to eq short_account_status_path(status.account, previous_status)
    end

    it 'sets the link for the next status' do
      status = Fabricate(:status)
      next_status = Fabricate(:status, account: status.account)

      get :show, params: { account_username: status.account.username, id: status }

      expect(response.headers['Link'].find_link(['rel', 'next']).href).to eq short_account_status_path(status.account, next_status)
    end
  end

  describe 'GET #activity' do
    context 'the duration is set' do
      let(:tag) { Fabricate(:tag, name: 'exp1d') }
      let(:status) { Fabricate(:status, tags: [tag]) }

      subject { get :activity, format: :json, params: { account_username: status.account.username, id: status } }

      it { is_expected.to have_http_status :not_found }
    end
  end
end
