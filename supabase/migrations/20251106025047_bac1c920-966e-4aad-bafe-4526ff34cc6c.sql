-- Create enum for event types
CREATE TYPE public.event_type AS ENUM ('formacao', 'retiro', 'reuniao', 'experiencia_oracao', 'introducao_dons');

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'coordenador', 'servo');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'servo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create prayer groups table
CREATE TABLE public.grupos_oracao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  local TEXT NOT NULL,
  horario TEXT NOT NULL,
  imagem_url TEXT,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo event_type NOT NULL,
  data DATE NOT NULL,
  horario TEXT NOT NULL,
  local TEXT,
  descricao TEXT,
  taxa_inscricao DECIMAL(10,2) DEFAULT 0,
  imagem_url TEXT,
  obrigatorio BOOLEAN DEFAULT false,
  chave_pix TEXT,
  qr_code_url TEXT,
  whatsapp_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news table
CREATE TABLE public.noticias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  imagem_url TEXT,
  autor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  publicado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event registrations table
CREATE TABLE public.inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  dados_formulario JSONB,
  confirmado BOOLEAN DEFAULT false,
  presente BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(evento_id, user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_oracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "User roles are viewable by everyone"
  ON public.user_roles FOR SELECT
  USING (true);

-- Create function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin or coordenador
CREATE OR REPLACE FUNCTION public.is_admin_or_coordenador(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'coordenador')
  )
$$;

-- Prayer groups policies
CREATE POLICY "Prayer groups are viewable by everyone"
  ON public.grupos_oracao FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert prayer groups"
  ON public.grupos_oracao FOR INSERT
  WITH CHECK (public.is_admin_or_coordenador(auth.uid()));

CREATE POLICY "Admins can update prayer groups"
  ON public.grupos_oracao FOR UPDATE
  USING (public.is_admin_or_coordenador(auth.uid()));

CREATE POLICY "Admins can delete prayer groups"
  ON public.grupos_oracao FOR DELETE
  USING (public.is_admin_or_coordenador(auth.uid()));

-- Events policies
CREATE POLICY "Events are viewable by everyone"
  ON public.eventos FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert events"
  ON public.eventos FOR INSERT
  WITH CHECK (public.is_admin_or_coordenador(auth.uid()));

CREATE POLICY "Admins can update events"
  ON public.eventos FOR UPDATE
  USING (public.is_admin_or_coordenador(auth.uid()));

CREATE POLICY "Admins can delete events"
  ON public.eventos FOR DELETE
  USING (public.is_admin_or_coordenador(auth.uid()));

-- News policies
CREATE POLICY "Published news are viewable by everyone"
  ON public.noticias FOR SELECT
  USING (publicado = true OR public.is_admin_or_coordenador(auth.uid()));

CREATE POLICY "Admins can insert news"
  ON public.noticias FOR INSERT
  WITH CHECK (public.is_admin_or_coordenador(auth.uid()));

CREATE POLICY "Admins can update news"
  ON public.noticias FOR UPDATE
  USING (public.is_admin_or_coordenador(auth.uid()));

CREATE POLICY "Admins can delete news"
  ON public.noticias FOR DELETE
  USING (public.is_admin_or_coordenador(auth.uid()));

-- Registrations policies
CREATE POLICY "Users can view their own registrations"
  ON public.inscricoes FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_or_coordenador(auth.uid()));

CREATE POLICY "Users can create registrations"
  ON public.inscricoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations"
  ON public.inscricoes FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin_or_coordenador(auth.uid()));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grupos_oracao_updated_at
  BEFORE UPDATE ON public.grupos_oracao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_noticias_updated_at
  BEFORE UPDATE ON public.noticias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'servo');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();