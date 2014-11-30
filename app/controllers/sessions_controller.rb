class SessionsController < ApplicationController
  skip_before_filter :authenticated?, only: [:new, :create]
  before_filter :google_mfa_authenticate, only: [:create]

  def new
  end

  def create
    session[:account_id] = 'new_session'
    redirect_to root_path
  end
end
