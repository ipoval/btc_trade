module ApplicationHelper
  def body_page_id
    params.slice(:controller, :action).values.join(' ').parameterize('_')
  end
end
