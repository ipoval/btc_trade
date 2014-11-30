module GoogleMfaConcern
  extend ActiveSupport::Concern

  included do
    before_filter :authenticated?
  end

  private

  def authenticated?
    redirect_to login_path if session[:account_id].blank?
  end

  def google_mfa_authenticate
    totp = ROTP::TOTP.new Rails.application.secrets.google_authenticator_secret
    verified = totp.verify google_mfa_token
    redirect_to(login_path, error: 'failed to authenticate') unless verified
  end

  def google_mfa_token
    params[:google_mfa_token].to_s
  end
end
