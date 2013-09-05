function is_dir(path)
	local x = lighty.stat(path)
	return x and lighty.stat(path).is_dir
end

function is_file(path)
	local x = lighty.stat(path)
	return x and lighty.stat(path).is_file
end

function rewrite(path)
	local path = string.gsub(path, "//", "/")
	lighty.env["physical.path"] = path
end

request_uri = lighty.env["physical.path"]
document_root = lighty.env["physical.doc-root"]
request_uri = string.gsub(request_uri, "/$", "")

if is_dir(request_uri) then
	if is_file(request_uri .. "/index.html") then
		rewrite(request_uri .. "/index.html")
		return
	elseif is_file(request_uri .. "/index.htm") then
		rewrite(request_uri .. "/index.htm")
		return
	elseif is_file(request_uri .. "/index.php") then
		rewrite(request_uri .. "/index.php")
		return
	elseif is_file(request_uri .. "/index.rb") then
		rewrite(request_uri .. "/index.rb")
		return
	else
		rewrite(document_root .. "/../framework/dircgi.rb")
		return
	end
end

if not is_file(request_uri) then
	x = string.gsub(request_uri, ".html$", ".rb")
	if is_file(x) then
		rewrite(x)
		return
	end
	x = request_uri .. ".rb"
	if is_file(x) then
		rewrite(x)
		return
	end
end

