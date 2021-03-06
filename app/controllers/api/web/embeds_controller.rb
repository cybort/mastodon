# frozen_string_literal: true

class Api::Web::EmbedsController < Pawoo::Api::Web::BaseController
  respond_to :json

  before_action :require_user!

  def create
    status = StatusFinder.new(params[:url]).status
    render json: status, serializer: OEmbedSerializer, width: 400
  rescue ActiveRecord::RecordNotFound
    oembed = OEmbed::Providers.get(params[:url])
    render json: Oj.dump(oembed.fields)
  rescue OEmbed::NotFound
    render json: {}, status: :not_found
  end
end
