module BitcoinClientsCredentialsYamlStore
  class Railtie < Rails::Railtie
    #   1)  require "config/boot.rb" to setup load paths
    #   2)  require railties and engines
    #   3)  Define Rails.application as "class MyApp::Application < Rails::Application"
    #   4)  Run config.before_configuration callbacks
    #   5)  Load config/environments/ENV.rb
    #   6)  Run config.before_initialize callbacks
    #   7)  Run Railtie#initializer defined by railties, engines and application.
    #       One by one, each engine sets up its load paths, routes and runs its config/initializers/* files.
    #   8)  Custom Railtie#initializers added by railties, engines and applications are executed
    #   9)  Build the middleware stack and run to_prepare callbacks
    #   10) Run config.before_eager_load and eager_load! if eager_load is true
    #   11) Run config.after_initialize callbacks
    config.before_configuration do
      require 'yaml/store'
      config.bitcoin_clients_credentials_store = YAML::Store.new(Rails.root + 'config/lake_btc_secrets.yml')
    end
  end
end
