# frozen_string_literal: true

require 'rails_helper'

describe Reaction, type: :model do
  let (:account) { Fabricate(:account) }

  describe 'self.push_account' do
    it 'pushes an account' do
      reaction = Fabricate(:reaction)
      Reaction.push_account account, id: reaction
      expect(reaction.accounts).to include account
    end

    it 'creates a new record if there is no existing one' do
      track = Fabricate(:track)
      Reaction.push_account account, track: track, text: '😺'
      expect(Reaction.where(accounts_count: 1, track: track, text: '😺')).to exist
    end

    it 'increments accounts_count of the existing record if any' do
      reaction = Fabricate(:reaction)

      expect do
        Reaction.push_account account, id: reaction
        reaction.reload
      end.to change { reaction.accounts_count }.by 1
    end
  end

  describe 'self.destroy_account' do
    before do
      DatabaseCleaner.clean
      DatabaseCleaner.strategy = :truncation
      DatabaseCleaner.clean_with :truncation
      DatabaseCleaner.start
    end

    it 'destroys the record if it is the only reaction' do
      reaction = Fabricate(:reaction, accounts: [account], accounts_count: 1)
      Reaction.destroy_account account, id: reaction
      expect{ reaction.reload }.to raise_error ActiveRecord::RecordNotFound
    end

    it 'decrements accounts_count of the existing record if there is another reaction' do
      accounts = 2.times.map { Fabricate(:account) }
      reaction = Fabricate(:reaction, accounts: accounts, accounts_count: 2)

      expect do
        Reaction.destroy_account accounts[0], id: reaction
        reaction.reload
      end.to change { reaction.accounts_count }.by -1
    end

    it 'does nothing if the record for the specified account is missing' do
      accounts = 2.times.map { Fabricate(:account) }
      reaction = Fabricate(:reaction, accounts: [accounts[0]], accounts_count: 1)

      expect do
        Reaction.destroy_account accounts[1], id: reaction
        reaction.reload
      end.not_to change { reaction.accounts_count }
    end
  end

  describe 'self.destroy_account_all' do
    before do
      DatabaseCleaner.clean
      DatabaseCleaner.strategy = :truncation
      DatabaseCleaner.clean_with :truncation
      DatabaseCleaner.start
    end

    it 'destroys every records which has only one reaction' do
      reaction = Fabricate(:reaction, accounts: [account], accounts_count: 1)
      Reaction.destroy_account_all account
      expect{ reaction.reload }.to raise_error ActiveRecord::RecordNotFound
    end

    it 'decrements accounts_count of every records which has multiple reactions' do
      accounts = 2.times.map { Fabricate(:account) }
      reaction = Fabricate(:reaction, accounts: accounts, accounts_count: 2)

      expect do
        Reaction.destroy_account_all accounts[0]
        reaction.reload
      end.to change { reaction.accounts_count }.by -1
    end

    it 'affects multiple records' do
      reactions = 2.times.map { Fabricate(:reaction, accounts: [account], accounts_count: 1) }

      Reaction.destroy_account_all account

      reactions.each do |reaction|
        expect{ reaction.reload }.to raise_error ActiveRecord::RecordNotFound
      end
    end
  end
end